export default {
  async fetch(request: Request, env: any): Promise<Response> {
    return env.ASSETS.fetch(request)
  },
}
