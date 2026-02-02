'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Loader2, Chrome, Mail, Lock, ArrowRight } from 'lucide-react'

export default function AuthPage() {
  const router = useRouter()
  const [method, setMethod] = useState<'signin' | 'signup' | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    try {
      const result = await signIn('google', {
        redirect: true,
        callbackUrl: '/dashboard'
      })
    } catch (err: any) {
      setError('Google sign-in failed. Please try again.')
      setGoogleLoading(false)
      console.error('[v0] Google sign-in error:', err)
    }
  }

  if (method === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 mb-6">
              <span className="text-white text-2xl font-bold">G</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">GROWZZY OS</h1>
            <p className="text-slate-600">AI-Powered Marketing Operations</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
            <Button 
              onClick={() => setMethod('signin')} 
              className="w-full h-12 bg-slate-900 text-white hover:bg-slate-800"
            >
              <Mail className="mr-2 h-5 w-5" />
              Sign In with Email
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">Or</span>
              </div>
            </div>

            <Button 
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              variant="outline"
              className="w-full h-12 border-2"
            >
              {googleLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Chrome className="mr-2 h-5 w-5" />
                  Sign in with Google
                </>
              )}
            </Button>

            <p className="text-sm text-slate-600 text-center">
              Don't have an account?{' '}
              <button 
                onClick={() => setMethod('signup')}
                className="text-slate-900 font-semibold hover:underline"
              >
                Create one
              </button>
            </p>
          </div>

          <p className="text-xs text-slate-500 text-center mt-8">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    )
  }

  if (method === 'signin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <button 
            onClick={() => setMethod(null)}
            className="mb-6 text-slate-600 hover:text-slate-900 flex items-center gap-2"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Back
          </button>
          
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h1>
            <p className="text-slate-600 mb-8">Sign in to your account</p>

            <Link href="/auth/signin" className="block">
              <Button className="w-full h-12 bg-slate-900 text-white hover:bg-slate-800">
                Sign In with Email
              </Button>
            </Link>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">Or</span>
              </div>
            </div>

            <Button 
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              variant="outline"
              className="w-full h-12 border-2"
            >
              {googleLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Chrome className="mr-2 h-5 w-5" />
                  Sign in with Google
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (method === 'signup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <button 
            onClick={() => setMethod(null)}
            className="mb-6 text-slate-600 hover:text-slate-900 flex items-center gap-2"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Back
          </button>
          
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Account</h1>
            <p className="text-slate-600 mb-8">Start your free trial today</p>

            <Link href="/auth/signup" className="block">
              <Button className="w-full h-12 bg-slate-900 text-white hover:bg-slate-800">
                Sign Up with Email
              </Button>
            </Link>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">Or</span>
              </div>
            </div>

            <Button 
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              variant="outline"
              className="w-full h-12 border-2"
            >
              {googleLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing up...
                </>
              ) : (
                <>
                  <Chrome className="mr-2 h-5 w-5" />
                  Sign up with Google
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
