import { runRoundtrip } from '../roundtrip'
console.log(JSON.stringify(await runRoundtrip(), null, 2))
