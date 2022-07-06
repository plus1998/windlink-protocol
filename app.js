const Koa = require('koa')
const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')

const { login } = require('./windlink');

const app = new Koa()
const router = new Router()

router.get('/login', async ctx => {
    const { username, password } = ctx.query
    ctx.body = await login(username, password)
})

app.use(bodyParser())
app.use(router.routes())

app.listen(9899, () => {
    console.log('App started.')
})