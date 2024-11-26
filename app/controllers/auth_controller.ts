import type { HttpContext } from '@adonisjs/core/http'
import { loginValidator, registerValidator } from '#validators/auth'
import app from '@adonisjs/core/services/app'
import User from '#models/user'
import env from '#start/env'

export default class AuthController {
  private sendCookie = env.get('AUTH_COOKIE_ENABLED', false)
  private cookieName = env.get('AUTH_COOKIE_NAME')

  async register({ request, response }: HttpContext) {
    const data = await request.validateUsing(registerValidator)

    const user = await User.create(data)
    const token = (await User.accessTokens.create(user)).toJSON()

    if (this.sendCookie) {
      response.cookie(this.cookieName, token.token, {
        httpOnly: true,
        sameSite: 'strict',
        secure: app.inProduction,
        expires: new Date('9999-12-31T23:59:59.999Z'),
      })
    }

    return user
  }

  async login({ request, response }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    const user = await User.verifyCredentials(email, password)
    const token = (await User.accessTokens.create(user)).toJSON()

    if (this.sendCookie) {
      response.cookie(this.cookieName, token.token, {
        httpOnly: true,
        sameSite: 'strict',
        secure: app.inProduction,
        expires: new Date('9999-12-31T23:59:59.999Z'),
      })
    }

    return user
  }

  async logout({ auth }: HttpContext) {
    const user = auth.user!

    await User.accessTokens.delete(user, user.currentAccessToken.identifier)

    return { message: 'success' }
  }

  async me({ auth }: HttpContext) {
    await auth.check()

    return {
      ...auth.user?.toJSON(),
    }
  }
}
