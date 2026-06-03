// jest.polyfills.js
import { TextDecoder, TextEncoder } from 'util'

Object.assign(global, { TextDecoder, TextEncoder })

// Add fetch polyfill for tests
import 'whatwg-fetch'