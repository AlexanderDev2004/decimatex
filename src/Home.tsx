
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

function Home() {
  return (
    <main className="min-h-screen bg-background p-6 md:p-10">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Try Shadcn Components</CardTitle>
            <CardDescription>
              Contoh sederhana pakai input dan button di halaman kamu.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input type="text" placeholder="Nama lengkap" />
            <Input type="email" placeholder="Email" />
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button>Kirim</Button>
            <Button variant="outline">Reset</Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}

export default Home;
  