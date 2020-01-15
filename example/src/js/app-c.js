import 'vlitejs'
import 'sanitize.css'
import '../css/app-c.css'

(async () => {
	await import(/* webpackChunkName: "lib-dynamic" */'../lib/dynamic')
})()
