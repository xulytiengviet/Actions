import './src/cvnss_converter.js';
const cv = globalThis.CVNSSConverter;
if (!cv) throw new Error('CVNSSConverter not initialized');
const test = cv.selfTest();
console.log(JSON.stringify({ version: cv.VERSION, audit: cv.audit(), selfTest: test }, null, 2));
if (!test.ok) process.exit(1);
const sample = '(Banr cikj vaol zaub X goc faiz ov bagz naol cugs dush deq xoaj bail hat vij zur, ses conl lair 3 bagz trogb. Roid banr gos hay zanj chuw vaol bagz banr mulb. Chuw ses bilb doiq ov 2 bagz conl lair. Xogp sao chep val zanj vaol batb cux dauy)';
const decoded = cv.fromCvss(sample).cqn;
console.log(decoded);
