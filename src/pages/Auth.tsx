
import { LoginForm } from '@/components/auth/LoginForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Shield, Users, TrendingUp } from 'lucide-react';

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding and Features */}
        <div className="hidden lg:block space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary h-12 w-12 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="text-primary-foreground h-6 w-6" />
              </div>
              <div>
                <h1 className="font-bold text-3xl text-gray-900">SettleSmart AI</h1>
                <p className="text-gray-600">Intelligent Real Estate Management</p>
              </div>
            </div>
            
            <p className="text-lg text-gray-700 leading-relaxed">
              Transform your real estate business with AI-powered insights, automated workflows, 
              and comprehensive property management tools.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Analytics & Insights</h3>
                <p className="text-gray-600">Get detailed analytics on property performance, market trends, and agent metrics.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Agent Management</h3>
                <p className="text-gray-600">Streamline agent verification, performance tracking, and lead distribution.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Secure & Compliant</h3>
                <p className="text-gray-600">Enterprise-grade security with role-based access and audit trails.</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">10K+</div>
              <div className="text-sm text-gray-600">Properties Managed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">500+</div>
              <div className="text-sm text-gray-600">Active Agents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">99.9%</div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          {/* Mobile header */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="bg-primary h-10 w-10 rounded-lg flex items-center justify-center">
                <Building2 className="text-primary-foreground h-5 w-5" />
              </div>
              <span className="font-semibold text-2xl">SettleSmart AI</span>
            </div>
            <p className="text-gray-600">Welcome back! Please sign in to continue.</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" className="text-sm font-medium">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="text-sm font-medium">Create Account</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card className="shadow-xl border-0">
                <CardHeader className="space-y-2 pb-6">
                  <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
                  <CardDescription className="text-center text-gray-600">
                    Sign in to your account to continue
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <LoginForm />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="signup">
              <Card className="shadow-xl border-0">
                <CardHeader className="space-y-2 pb-6">
                  <CardTitle className="text-2xl font-bold text-center">Get Started</CardTitle>
                  <CardDescription className="text-center text-gray-600">
                    Create your account to access all features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SignUpForm />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              By continuing, you agree to our{' '}
              <a href="#" className="text-primary hover:underline font-medium">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-primary hover:underline font-medium">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
