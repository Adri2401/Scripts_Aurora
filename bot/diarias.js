// Se mantiene por compatibilidad: ahora todo está en aurora.js («node diarias.js» = «node aurora.js diarias»).
if (!process.argv.includes('--sesion')) process.argv.splice(2, 0, 'diarias');
require('./aurora.js');
