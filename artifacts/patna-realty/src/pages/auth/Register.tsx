import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegister, RegisterBodyRole } from "@workspace/api-client-react";
import { setSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/lib/i18n";

const formSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["tenant", "shopkeeper", "buyer"] as const),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerMutation = useRegister();
  const { t } = useLang();
  const R = t.auth.register;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", password: "", role: "buyer" },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    registerMutation.mutate({ data: values }, {
      onSuccess: (data) => {
        setSession({ user: data.user, token: data.token, role: data.user.role });
        toast({ title: R.successTitle });
        setLocation(data.user.role === "buyer" ? "/" : "/tenant");
      },
      onError: (err) => {
        toast({ title: R.failTitle, description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{R.title}</CardTitle>
          <CardDescription>{R.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>{R.name}</FormLabel><FormControl><Input placeholder={R.namePlaceholder} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>{R.email}</FormLabel><FormControl><Input placeholder={R.emailPlaceholder} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem><FormLabel>{R.password}</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel>{R.role}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder={R.rolePlaceholder} /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="buyer">{R.buyer}</SelectItem>
                      <SelectItem value="tenant">{R.tenant}</SelectItem>
                      <SelectItem value="shopkeeper">{R.shopkeeper}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? R.loading : R.btn}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            {R.hasAccount}{" "}
            <Link href="/login" className="text-primary hover:underline">{R.login}</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
