# تسجيلات ElevenLabs

- الخطة المجانية: توليد واحد في نفس الوقت، وأحياناً "Free generations are busy".
- flow: bU2oQsP3RaUSv937yqmp — model eleven_v3 — نسخة وحدة لكل مقطع (generations_count=1)
- chunks.json: 33 مقطع (كل مقطع حتى 10 جمل بصوت واحد)، split.py يقصّها بعد التنزيل.
- تم: المقاطع 0 إلى 13. الباقي: 14 إلى 32.
- بعد كل دفعة: python voicemap.py (يحدّث src/data/voicemap.json) ثم build ونشر.
