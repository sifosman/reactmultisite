"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function DebugAuthPage() {
  const [email, setEmail] = useState("thecoastalwarehouse@gmail.com");
  const [password, setPassword] = useState("Sameer1964!");
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function testLogin() {
    setLoading(true);
    setResult("");
    
    try {
      const supabase = createSupabaseBrowserClient();
      
      // Step 1: Test authentication
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (authError) {
        setResult(`❌ Auth Error: ${authError.message}`);
        return;
      }
      
      setResult(`✅ Auth successful! User ID: ${authData.user?.id}`);
      
      // Step 2: Check profile
      if (authData.user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authData.user.id)
          .maybeSingle();
          
        if (profileError) {
          setResult(prev => prev + `\n❌ Profile Error: ${profileError.message}`);
          return;
        }
        
        if (profile) {
          setResult(prev => prev + `\n✅ Profile found: ${JSON.stringify(profile, null, 2)}`);
        } else {
          setResult(prev => prev + `\n❌ No profile found for user`);
        }
      }
      
    } catch (error) {
      setResult(`❌ Unexpected error: ${error}`);
    } finally {
      setLoading(false);
    }
  }

  async function checkUserExists() {
    setLoading(true);
    setResult("");
    
    try {
      const supabase = createSupabaseBrowserClient();
      
      // Try to sign up the user to check if they exist
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });
      
      if (error) {
        if (error.message.includes("already registered")) {
          setResult(`✅ User already exists in auth system`);
        } else {
          setResult(`❌ Sign up error: ${error.message}`);
        }
        return;
      }
      
      if (data.user && !data.user.identities?.length) {
        setResult(`✅ User exists but needs email verification`);
      } else {
        setResult(`ℹ️ User was created (may need verification)`);
      }
      
    } catch (error) {
      setResult(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Authentication Debug</h1>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={testLogin}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Testing..." : "Test Login"}
            </button>
            
            <button
              onClick={checkUserExists}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-60"
            >
              {loading ? "Checking..." : "Check User Exists"}
            </button>
          </div>
          
          {result && (
            <div className="mt-4 p-4 bg-gray-100 rounded-md">
              <h3 className="font-semibold mb-2">Result:</h3>
              <pre className="whitespace-pre-wrap text-sm">{result}</pre>
            </div>
          )}
        </div>
        
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <h3 className="font-semibold text-yellow-800">Instructions:</h3>
          <ol className="list-decimal list-inside text-sm text-yellow-700 mt-2">
            <li>Click "Check User Exists" to see if the user is registered</li>
            <li>Click "Test Login" to test the authentication flow</li>
            <li>The results will show you exactly what's happening</li>
            <li>If the user exists but has no profile, we need to create one</li>
            <li>If the user exists but role is not 'admin', we need to update it</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
