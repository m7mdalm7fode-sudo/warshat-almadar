import io, json, os
os.chdir(r'D:\لعبة التصليح')
VOICES = {
  'R': '32VOws2aqnoZSe3MV44q',  # Rashed - Saudi narrator (male)
  'A': 'gsVllkACctYUXripwcx4',  # Abdulaziz Alzahrani (male)
  'M': 'owhXz0MzSe5DSEzgWad4',  # Maher - comedic Gulf (male)
  'F': 'YCN2uLvOoKxKJtRmeub3',  # Fahad - warm Saudi (male)
  'Q': 'jf2onDfbTNQCBhHG81Ks',  # Muafaq - calm Saudi (male)
  'Y': 'zVcSpg1j2s3dWbybE40V',  # Yasser - calm friendly Saudi (male)
  'S': '1hZPzTNSNScNgOb7t8UD',  # Sultan - Najdi (male)
}
STORY_V = {'captain_rashid': 'R', 'salem_haddad': 'S', 'nox': 'Q', 'eng_qasim': 'F', 'mirsal': 'M', 'hamdan': 'M',
  'stranger_bag': 'A', 'sheikh_mubarak': 'Q', 'smuggler_zaid': 'Y', 'omran': 'R', 'pilot_yasser': 'A',
  'inspector_nader': 'Y', 'khaled_miner': 'S', 'waddah': 'A', 'officer_stolen': 'S', 'officer_reward': 'S',
  'officer_sabotage': 'S', 'zaid_return': 'Y', 'officer_raid': 'S', 'omran_return': 'R', 'inspector_return': 'Y'}
REC_V = {'abu_fahad': 'Q', 'zirr7': 'F', 'kzar': 'R', 'boghi': 'M'}
OWN_V = {'haj_sulaiman': 'Q', 'eng_badr': 'F', 'sheikh_hamad': 'R', 'zirr9': 'Y', 'uncle_saleh': 'S', 'flux': 'A', 'abu_rashid': 'M', 'eng_waleed': 'Y'}

c = json.load(io.open('src/data/customers.json', encoding='utf-8'))
t = json.load(io.open('src/data/thieves.json', encoding='utf-8'))

# كلام المشتبهين بدون اسم الغرض (تسجيل واحد يكفي)
t['thieves']['claims'] = [
 ["السلام عليكم... بسرعة الله يخليك.", "هالغرض حقي من زمان... لا تسأل من وين.", "صلّحه وأدفع لك زيادة، بس لا تكثّر أسئلة."],
 ["هلا يا معلّم.", "هالغرض ورث من عمّي، الله يرحمه.", "أبيه شغّال اليوم، عندي زبون... أقصد عندي حاجة فيه."],
 ["لا تطالع فيني كذا، أنا زبون عادي.", "هالغرض حقي. الاسم المحفور عليه؟ هذا اسم... الشركة.", "كم تبي؟ أدفع الضعف."],
]
t['innocents']['claims'] = [
 ["أدري شكلي يخوّف، بس أنا طيب والله.", "هالغرض حقي، واسمي محفور عليه من يوم شريته.", "تقدر تصلّحه؟"],
 ["لا تخاف من اللثام، غبار المناجم يذبح.", "هالغرض حقي، شوف اسمي عليه.", "أبيه قبل الوردية الجاية."],
]

# مفاتيح الأصوات في البيانات
for s in c['story']: s['voice'] = STORY_V[s['id']]
for r in c['recurring']: r['voice'] = REC_V[r['id']]
for o in t['owners']: o['voice'] = OWN_V[o['id']]
io.open('src/data/customers.json', 'w', encoding='utf-8').write(json.dumps(c, ensure_ascii=False, indent=2))
io.open('src/data/thieves.json', 'w', encoding='utf-8').write(json.dumps(t, ensure_ascii=False, indent=2))

lines = []
def add(v, txt):
    if txt and (v, txt) not in {(l[0], l[1]) for l in lines}:
        lines.append((v, txt))

for s in c['story']:
    v = s['voice']
    for l in s['dialog']: add(v, l)
    for o in s.get('moral', {}).get('options', []):
        for k in (o, o.get('pass', {}), o.get('fail', {})):
            if k.get('reply'): add(v, k['reply'])
add('S', 'نتقابل كثير يا معلّم...')
for r in c['recurring']:
    for l in r['memory'].values(): add(r['voice'], l)
    for vv in r['visits']:
        for l in vv['dialog']: add(r['voice'], l)
for o in t['owners']:
    for l in o['thanks'] + o['lost']: add(o['voice'], l)
    add(o['voice'], 'تدري عنه شي يا معلّم؟')
    add(o['voice'], 'على الأقل صدقت معي... بعطي الشرطة الوصف، وخذها درس.')
    add(o['voice'], 'طيب... الله يعوّضني.')
    add(o['voice'], 'ورشتك صارت حديث السوق. الله يحفظك.')
st = t['stall']
for l in st['caught'] + st['innocent'] + st['escaped']: add('S', l)
# المشتبهين: صوت واحد
for cl in t['thieves']['claims'] + t['innocents']['claims']:
    for l in cl: add('A', l)
for p in st['prompts']: add('A', p['q'])
add('A', st['flee'])
add('A', 'تتصل على أحد عني؟! أنا ماشي، وغرضي معي.')
add('A', 'تتهمني قدّام الناس؟! ما عاد أرجع لورشتك.')
# الزبائن العاديين
g = c['generic']
for l in sum(g['greet'].values(), []) + g['ask'] + [p['problem'] for p in g['problems']]: add('F', l)
# ردود الفعل بثلاث أصوات
for k, arr in c['reactions'].items():
    if k == 'playerNegotiate': continue
    for l in arr:
        for v in ('F',): add(v, l)

out = [{'i': i, 'v': v, 'voice_id': VOICES[v], 'text': txt} for i, (v, txt) in enumerate(lines)]
json.dump(out, io.open(r'C:\Users\User\AppData\Local\Temp\claude\a7c79bc4b68fbc00\d6169e20-98d2-4a2a-9967-bb2c03c1b13a\scratchpad\lines.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print(len(out), 'lines', sum(len(x['text']) for x in out), 'chars')
