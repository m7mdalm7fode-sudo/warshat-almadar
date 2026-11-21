# يبني خريطة الأصوات: "مفتاح الصوت|النص" -> اسم الملف، للملفات الموجودة فقط
import io, json, os
HERE = os.path.dirname(os.path.abspath(__file__))
VOICES = r'D:\لعبة التصليح\public\voices'
L = json.load(io.open(os.path.join(HERE, 'lines.json'), encoding='utf-8'))
m = {}
for x in L:
    f = f"l{x['i']}.mp3"
    if os.path.exists(os.path.join(VOICES, f)):
        m[f"{x['v']}|{x['text']}"] = f
json.dump(m, io.open(r'D:\لعبة التصليح\src\data\voicemap.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
done = sorted({c['c'] for c in json.load(io.open(os.path.join(HERE, 'chunks.json'), encoding='utf-8')) if all(os.path.exists(os.path.join(VOICES, f'l{i}.mp3')) for i in c['ids'])})
print(len(m), 'of', len(L), 'lines recorded; chunks done:', done)
