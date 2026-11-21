# usage: python split.py <chunk_index> <url>
# ينزّل تسجيل المقطع، يقصّه عند أطول الوقفات بعدد الجمل، ويحفظ كل جملة لحالها
import io, json, os, re, subprocess, sys, statistics, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = r'D:\لعبة التصليح\public\voices'
os.makedirs(OUT, exist_ok=True)
os.makedirs(os.path.join(HERE, 'raw'), exist_ok=True)

ci = int(sys.argv[1]); url = sys.argv[2]
chunks = json.load(io.open(os.path.join(HERE, 'chunks.json'), encoding='utf-8'))
lines = {x['i']: x for x in json.load(io.open(os.path.join(HERE, 'lines.json'), encoding='utf-8'))}
c = chunks[ci]
n = len(c['ids'])
raw = os.path.join(HERE, 'raw', f'c{ci}.mp3')
if not os.path.exists(raw) or os.path.getsize(raw) < 1000:
    urllib.request.urlretrieve(url, raw)

def dur(p):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p]).decode().strip())

total = dur(raw)
best = None
for noise in (-38, -42, -34, -46):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', raw, '-af', f'silencedetect=noise={noise}dB:d=0.12', '-f', 'null', '-'], capture_output=True, text=True, encoding='utf-8', errors='ignore')
    starts = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', r.stderr)]
    ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', r.stderr)]
    sil = [(s, e) for s, e in zip(starts, ends) if s > 0.15 and e < total - 0.15]
    if len(sil) >= n - 1:
        best = (noise, sil)
        break
if not best:
    print('FAIL not enough silences', ci); sys.exit(1)
noise, sil = best
import math
# المدة المتوقعة لكل جملة حسب طول نصها
w = [len(lines[li]['text']) + 6 for li in c['ids']]
exp = [total * x / sum(w) for x in w]
S = len(sil)
mids = [(s + e) / 2 for s, e in sil]
lens = [e - s for s, e in sil]
INF = float('inf')
# dp[k][j]: أفضل تكلفة لوضع القطع رقم k عند الوقفة j
dp = [[INF] * S for _ in range(n - 1)]
bk = [[-1] * S for _ in range(n - 1)]
def segc(d, e):
    return (math.log(max(d, 0.05) / e)) ** 2
for j in range(S):
    dp[0][j] = segc(mids[j], exp[0]) - 0.8 * lens[j]
for k in range(1, n - 1):
    for j in range(S):
        for i in range(j):
            if dp[k - 1][i] == INF: continue
            v = dp[k - 1][i] + segc(mids[j] - mids[i], exp[k]) - 0.8 * lens[j]
            if v < dp[k][j]: dp[k][j], bk[k][j] = v, i
best_j, best_v = -1, INF
for j in range(S):
    if dp[n - 2][j] == INF: continue
    v = dp[n - 2][j] + segc(total - mids[j], exp[n - 1])
    if v < best_v: best_v, best_j = v, j
path = [best_j]
for k in range(n - 2, 0, -1):
    path.append(bk[k][path[-1]])
path.reverse()
bounds = [0.0] + [mids[j] for j in path] + [total]

ratios = []
for k, li in enumerate(c['ids']):
    a, b = bounds[k], bounds[k + 1]
    ratios.append((b - a) / max(1, len(lines[li]['text'])))
med = statistics.median(ratios)
bad = [c['ids'][k] for k, r in enumerate(ratios) if r < med * 0.45 or r > med * 2.2]

for k, li in enumerate(c['ids']):
    a, b = bounds[k], bounds[k + 1]
    out = os.path.join(OUT, f'l{li}.mp3')
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', raw, '-ss', f'{a:.3f}', '-to', f'{b:.3f}',
                    '-af', 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse',
                    '-ac', '1', '-b:a', '64k', out], check=True)
print(f'chunk {ci}: {n} lines, total {total:.1f}s, noise {noise}, ratios ' + ' '.join(f'{r:.3f}' for r in ratios), 'BAD:' if bad else 'OK', bad)
