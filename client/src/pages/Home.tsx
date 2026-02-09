import { useState } from "react";
import { useGame } from "@/hooks/use-game";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GameCard } from "@/components/GameCard";
import { motion } from "framer-motion";
import { Loader2, Users, Ghost, LayoutGrid } from "lucide-react";

export default function Home() {
  const { createRoom, joinRoom } = useGame();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [rounds, setRounds] = useState(1);
  const [category, setCategory] = useState("گشتی");

  const handleCreate = () => {
    if (!name.trim()) return;
    createRoom.mutate({ name, rounds, category });
  };

  const handleJoin = () => {
    if (!name.trim() || code.length !== 4) return;
    joinRoom.mutate({ code: code.toUpperCase(), name });
  };

  const categories = [
    { id: "گشتی", name: "گشتی" },
    { id: "خوارن", name: "خوارن" },
    { id: "ئاژەڵ", name: "ئاژەڵ" },
    { id: "وەرزش", name: "وەرزش" }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center space-y-2"
        >
          <div className="inline-block p-4 rounded-full bg-white shadow-xl mb-4 rotate-3 animate-float">
            <Ghost className="w-16 h-16 text-primary" />
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-primary tracking-tight">
            ياريا<span className="text-accent"> درەوکەر</span>
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            درەوی بکە وخو خلاس بکە جافی من
          </p>
        </motion.div>

        <GameCard className="backdrop-blur-sm bg-white/90">
          <Tabs defaultValue="join" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 p-1 bg-muted/50 rounded-xl">
              <TabsTrigger value="join" className="rounded-lg font-bold">
                بەشداری بکە
              </TabsTrigger>
              <TabsTrigger value="create" className="rounded-lg font-bold">
                ژوورەکێ چێکە
              </TabsTrigger>
            </TabsList>

            <TabsContent value="join" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground ml-1">
                    ناڤێ تە
                  </label>
                  <Input
                    placeholder="نافی خو و بابی خو جیکە..."
                    className="h-14 text-lg bg-gray-50 border-2 focus:border-primary/50 rounded-xl"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground ml-1">
                    کۆدێ ژوورێ
                  </label>
                  <Input
                    placeholder="ABCD"
                    className="h-14 text-lg bg-gray-50 border-2 focus:border-primary/50 rounded-xl uppercase tracking-[0.2em] font-mono text-center"
                    maxLength={4}
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                  />
                </div>
                <Button
                  size="lg"
                  className="w-full h-14 text-xl font-bold rounded-xl shadow-lg shadow-primary/25 mt-4 btn-bounce"
                  onClick={handleJoin}
                  disabled={joinRoom.isPending || !name || code.length !== 4}
                >
                  {joinRoom.isPending ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    "دی وەرە تیدا زی"
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="create" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground ml-1">
                  ناڤێ تە
                </label>
                <Input
                  placeholder="نافی خو و بابی خو جیکە..."
                  className="h-14 text-lg bg-gray-50 border-2 focus:border-primary/50 rounded-xl"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground ml-1">
                  جۆرێ پەیڤان (Category)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((cat) => (
                    <Button
                      key={cat.id}
                      variant={category === cat.id ? "default" : "outline"}
                      className={`h-12 text-lg font-bold rounded-xl ${category === cat.id ? "bg-accent text-white shadow-md hover:bg-accent/90" : "bg-gray-50 border-2"}`}
                      onClick={() => setCategory(cat.id)}
                    >
                      {cat.name}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground ml-1">
                  هژمارا پەیڤان (Round)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <Button
                      key={num}
                      variant={rounds === num ? "default" : "outline"}
                      className={`h-12 text-lg font-bold rounded-xl ${rounds === num ? "bg-primary shadow-md" : "bg-gray-50 border-2"}`}
                      onClick={() => setRounds(num)}
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex gap-3 items-start">
                <div className="bg-yellow-100 p-2 rounded-lg">
                  <Users className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h4 className="font-bold text-yellow-800">چێکرنا ژوورێ</h4>
                  <p className="text-sm text-yellow-700 leading-tight mt-1">
                    دێ کۆدەکێ وەرگری دا ل گەل هەڤالێن خۆ پارڤە بکەی. پێدڤی ب ٣+
                    یاریزانان هەیە.
                  </p>
                </div>
              </div>
              <Button
                size="lg"
                className="w-full h-14 text-xl font-bold rounded-xl shadow-lg shadow-primary/25 bg-secondary hover:bg-secondary/90 text-white mt-4 btn-bounce"
                onClick={handleCreate}
                disabled={createRoom.isPending || !name}
              >
                {createRoom.isPending ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  "ژوورەکێ چێکە"
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </GameCard>
      </div>
    </div>
  );
}
