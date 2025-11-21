import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '')
	const token = env.STARLING_ACCESS_TOKEN || env.STARLING_ACCESS_TOKEN || ''

	return {
		plugins: [react()],
		server: {
			proxy: {
				'/api': {
					target: 'https://api-sandbox.starlingbank.com',
					changeOrigin: true,
					secure: true,
					rewrite: (path) => path.replace(/^\/api/, '/api'),
					configure: (proxy) => {
						proxy.on('proxyReq', (proxyReq) => {
							if (token) {
								proxyReq.setHeader('Authorization', `Bearer ${token}`)
							}
							proxyReq.setHeader('Accept', 'application/json')
						})
					},
				},
			},
		},
	}
})
