import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin } from "@workspace/api-client-react";
import { setSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/lib/i18n";

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();
  const { t } = useLang();
  const L = t.auth.login;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    loginMutation.mutate({ data: values }, {
      onSuccess: (data) => {
        setSession({ user: data.user, token: data.token, role: data.user.role });
        toast({ title: L.successTitle });
        if (data.user.role === "admin") {
          setLocation("/admin");
        } else if (data.user.role === "tenant" || data.user.role === "shopkeeper") {
          setLocation("/tenant");
        } else {
          setLocation("/");
        }
      },
      onError: (err) => {
        toast({ title: L.failTitle, description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{L.title}</CardTitle>
          <CardDescription>{L.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{L.email}</FormLabel>
                    <FormControl><Input placeholder={L.emailPlaceholder} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{L.password}</FormLabel>
                    <FormControl><Input type="password" placeholder={L.passwordPlaceholder} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? L.loading : L.btn}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            {L.noAccount}{" "}
            <Link href="/register" className="text-primary hover:underline">{L.register}</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
