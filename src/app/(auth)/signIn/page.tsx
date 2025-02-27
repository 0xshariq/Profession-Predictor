"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, UserCircle2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { signinSchema } from "@/schemas/signInSchema";
import { signIn } from "next-auth/react";
import { Separator } from "@/components/ui/separator";

const SignIn = () => {
  // State for managing form submission loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Initialize form with validation schema and default values
  const form = useForm<z.infer<typeof signinSchema>>({
    resolver: zodResolver(signinSchema),
    defaultValues: { email: "", password: "" },
  });

  // Handle user login with credentials
  const onSubmit = async (data: z.infer<typeof signinSchema>) => {
    setIsSubmitting(true);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      
      if (result?.error) {
        toast({
          title: "Sign In Failed",
          description: result.error === "CredentialsSignin" ? "Invalid email or password." : result.error,
          variant: "destructive",
        });
      }
      if (result?.url) {
        router.replace("/");
      }
    } catch (error) {
      toast({ title: "Sign In Failed", description: String(error), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle guest login
  const handleGuestLogin = async () => {
    setIsGuestLoading(true);
    try {
      const response = await fetch("/api/guest", { method: "POST", headers: { "Content-Type": "application/json" } });
      if (!response.ok) throw new Error("Failed to create guest session");
      
      const data = await response.json();
      if (data.success) {
        toast({
          title: "Welcome Guest!",
          description: "You can make up to 3 profession predictions. Sign up for unlimited access!",
        });
        router.replace("/");
      }
    } catch (error) {
      toast({ title: "Guest Login Failed", description: String(error), variant: "destructive" });
    } finally {
      setIsGuestLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg shadow-lg">
        {/* Title Section */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Welcome to Profession Predictor</h1>
          <p className="text-muted-foreground">Sign in to start your amazing journey</p>
        </div>

        {/* Sign-in Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Input Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password Input Field */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your password" type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Sign In Button */}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing In...</> : "Sign In"}
            </Button>
          </form>
        </Form>

        {/* Social Sign-In Options */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        {/* Google Sign-In Button */}
        <Button variant="outline" className="w-full flex items-center justify-center space-x-2" onClick={() => signIn("google")}>
          <FcGoogle className="h-5 w-5" /> <span>Sign in with Google</span>
        </Button>

        {/* GitHub Sign-In Button */}
        <Button variant="outline" className="w-full flex items-center justify-center space-x-2" onClick={() => signIn("github")}>
          <FaGithub className="h-5 w-5" /> <span>Sign in with GitHub</span>
        </Button>

        {/* Guest Login Button */}
        <Button variant="outline" className="w-full flex items-center justify-center space-x-2" onClick={handleGuestLogin} disabled={isGuestLoading}>
          {isGuestLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Guest Session...</> : <><UserCircle2 className="mr-2 h-4 w-4" /> Continue as Guest</>}
        </Button>

        {/* Sign Up Link */}
        <div className="text-center text-sm">
          <p className="text-muted-foreground">
            Don&apos;t have an account? <Link href="/signUp" className="font-medium text-primary hover:underline">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
