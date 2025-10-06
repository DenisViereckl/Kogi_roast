import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Flame } from "lucide-react";
import { CircularProgressLoader } from "@/components/CircularProgressLoader";
import { RoleSelectionModal } from "@/components/RoleSelectionModal";
import { OpenAIService } from "@/services/openai";
import roastedChicken from "@/assets/krocan.png";

// Store API key in localStorage on app load
const OPENAI_API_KEY = "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";

// Store the API key in localStorage on component mount
if (!OpenAIService.getStoredApiKey()) {
  OpenAIService.storeApiKey(OPENAI_API_KEY);
}

const questionnaireQuestions = [
  "Zůstávám klidný i v náročných situacích.",
  "Dokážu se rychle vzpamatovat z neúspěchu.",
  "Snadno zvládám stres a tlak termínů.",
  "Neberu si věci příliš osobně.",
  "I při problémech si udržuji pozitivní přístup.",
  "Mám silnou potřebu dosahovat vysokých cílů.",
  "Usiluji o to být v práci vidět a prosadit se.",
  "Přirozeně přebírám roli lídra, když je to potřeba.",
  "Soutěživost mě motivuje k lepším výkonům.",
  "Mám rád, když jsou výsledky mé práce uznány a oceněny.",
  "Rád trávím čas mezi lidmi a poznávám nové kolegy.",
  "Snadno navazuji neformální konverzaci.",
  "Cítím se dobře na společenských akcích a setkáních.",
  "Často vyhledávám příležitosti k týmové spolupráci.",
  "Sdílení nápadů s ostatními mi dodává energii.",
  "Naslouchám druhým a zajímám se o jejich názory.",
  "Dávám pozor, abych svým jednáním neurazil ostatní.",
  "Snažím se vycházet dobře s různými typy lidí.",
  "Dokážu se vcítit do situace druhých.",
  "Jsem diplomatický/á i v konfliktních situacích.",
  "Dodržuji termíny a závazky.",
  "Plánuji si práci tak, aby byla efektivní a přehledná.",
  "Jsem důsledný/á v dokončování úkolů.",
  "Mám rád/a jasně stanovená pravidla a procesy.",
  "Připravuji se pečlivě na schůzky a prezentace.",
  "Zajímám se o nové přístupy a metody.",
  "Často přicházím s originálními nápady.",
  "Rád/a zkoumám, jak by šly věci dělat jinak.",
  "Inovace v práci mě motivují.",
  "Učím se z experimentování a hledání nových cest.",
  "Pravidelně si rozšiřuji znalosti v oboru.",
  "Rád/a čtu odborné články, knihy nebo sleduji kurzy."
];

const responseOptions = [
  "Souhlasím",
  "Trochu souhlasím", 
  "Trochu nesouhlasím",
  "Nesouhlasím"
];

const Index = () => {
  const [companyInput, setCompanyInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isConsulting, setIsConsulting] = useState(false);
  const [roastResult, setRoastResult] = useState("");
  const [consultationResult, setConsultationResult] = useState("");
  const [activeTab, setActiveTab] = useState("analysis");
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"employee" | "manager" | null>(null);
  const [questionnaireResponses, setQuestionnaireResponses] = useState<Record<number, string>>({});
  const { toast } = useToast();

  const handleRoast = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyInput.trim()) {
      toast({
        title: "Chyba",
        description: "Zadejte prosím název firmy.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setRoastResult("");

    try {
      const openaiService = new OpenAIService(OpenAIService.getStoredApiKey() || OPENAI_API_KEY);
      const result = await openaiService.analyzeCompany(companyInput.trim());

      if (result.error) {
        throw new Error(result.error);
      }

      setRoastResult(result.content);
      toast({
        title: "Roast dokončen!",
        description: "Analýza firmy byla úspěšně vygenerována.",
      });
    } catch (error) {
      console.error("Chyba při roastu:", error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se provést analýzu. Zkuste to znovu.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGetConsultation = () => {
    setShowRoleModal(true);
  };

  const handleRoleSelected = (role: "employee" | "manager") => {
    setSelectedRole(role);
    setShowQuestionnaire(true);
  };

  const handleQuestionnaireResponse = (questionIndex: number, response: string) => {
    setQuestionnaireResponses(prev => ({
      ...prev,
      [questionIndex]: response
    }));
  };

  const handleQuestionnaireSubmit = async () => {
    if (!selectedRole) return;

    setIsConsulting(true);
    setShowQuestionnaire(false);
    setActiveTab("consultation");

    try {
    const questionnaireData = questionnaireQuestions
      .map((question, index) => ({
        question,
        answer: questionnaireResponses[index]
      }))
      .filter(item => item.answer && item.answer.trim() !== "");

      const openaiService = new OpenAIService(OpenAIService.getStoredApiKey() || OPENAI_API_KEY);
      const result = await openaiService.generateConsultation(
        companyInput,
        roastResult,
        questionnaireData,
        selectedRole
      );

      if (result.error) {
        throw new Error(result.error);
      }

      setConsultationResult(result.content);
      setActiveTab("consultation");
      toast({
        title: "Poradenství vygenerováno!",
        description: "Personalizované poradenství je připraveno.",
      });
    } catch (error) {
      console.error("Chyba při generování poradenství:", error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se vygenerovat poradenství. Zkuste to znovu.",
        variant: "destructive",
      });
    } finally {
      setIsConsulting(false);
      setQuestionnaireResponses({});
      setSelectedRole(null);
    }
  };

  const allQuestionsAnswered = questionnaireQuestions.length === Object.keys(questionnaireResponses).length;

  const handleGetKogiConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailInput.trim()) {
      toast({
        title: "Chyba",
        description: "Zadejte prosím váš email.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Email odeslán!",
      description: "Brzy se vám ozveme s nabídkou bezplatné konzultace.",
    });
    
    setEmailInput("");
    setActiveTab("consultation");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ backgroundColor: '#0D1722' }}>
      {/* Header with Image */}
      <div className="flex items-center gap-8 mb-12">
        <img 
          src={roastedChicken} 
          alt="Roasted chicken illustration"
          className="w-40 h-40 object-contain"
        />
        <div className="text-left">
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-4">
            Kogi Roast
          </h1>
          <p className="text-xl text-white/80">
            Zatop firmě dle vlastní volby
          </p>
        </div>
      </div>

      {/* Main Card - 85% width */}
      <div className="w-[85%] max-w-5xl">
        <Card className="p-8 shadow-lg bg-white border-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 border-b border-gray-200 pb-2 bg-transparent">
              <TabsTrigger value="analysis" className="text-base font-medium">
                Analýza Firmy
              </TabsTrigger>
              <TabsTrigger 
                value="consultation" 
                disabled={!roastResult}
                className="text-base font-medium"
              >
                Personalizované poradenství
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="space-y-8">
              {/* Company Input */}
              <form onSubmit={handleRoast} className="space-y-6">
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Název firmy (např. AAA Auto Praha)"
                    value={companyInput}
                    onChange={(e) => setCompanyInput(e.target.value)}
                    className="h-14 text-lg bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                    disabled={isAnalyzing}
                  />
                </div>
                
                <Button
                  type="submit"
                  disabled={isAnalyzing || !companyInput.trim()}
                  variant="coral"
                  className="w-full h-14 text-lg font-semibold"
                >
                  {isAnalyzing ? (
                    "Analyzuji..."
                  ) : (
                    <>
                      🔥 Roast!
                    </>
                  )}
                </Button>
              </form>

              {/* Loading */}
              {isAnalyzing && (
                <div className="flex justify-center py-12">
                  <CircularProgressLoader />
                </div>
              )}

              {/* Roast Results */}
              {roastResult && (
                <div className="space-y-6">
                  <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      🔥 Roast výsledek
                    </h3>
                    <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {roastResult}
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleGetConsultation}
                    className="w-full h-14 text-lg font-semibold bg-gray-900 hover:bg-gray-800 text-white transition-all duration-300"
                  >
                    Získat personalizované poradenství
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="consultation" className="space-y-8">
              {/* Loading */}
              {isConsulting && (
                <div className="flex justify-center py-12">
                  <CircularProgressLoader />
                </div>
              )}

              {/* Consultation Results */}
              {consultationResult && (
                <div className="space-y-6">
                  <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      💡 Personalizované poradenství
                    </h3>
                    <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {consultationResult}
                    </div>
                  </div>
                  
                  {/* Email Lead Gen */}
                  <form onSubmit={handleGetKogiConsultation} className="space-y-4">
                    <div className="text-center">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        Chcete více personalizovaných rad?
                      </h4>
                      <p className="text-gray-600 mb-4">
                        Zanechte nám email a získejte bezplatnou Kogi konzultaci
                      </p>
                    </div>
                    
                    <div className="flex gap-3">
                      <Input
                        type="email"
                        placeholder="váš.email@firma.cz"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="h-12 flex-1 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                        required
                      />
                      <Button
                        type="submit"
                        className="h-12 px-8 bg-gray-900 hover:bg-gray-800 text-white transition-all duration-300"
                      >
                        Získat Kogi konzultaci zdarma
                      </Button>
                    </div>
                  </form>
                </div>
              )}
              
              {!consultationResult && !isConsulting && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">
                    Zde se zobrazí vaše personalizované poradenství po vyplnění dotazníku.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* Role Selection Modal */}
      <RoleSelectionModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        onSelectRole={handleRoleSelected}
      />

      {/* Questionnaire Modal */}
      <Dialog open={showQuestionnaire} onOpenChange={() => setShowQuestionnaire(false)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-center">
                Dotazník pro personalizované poradenství
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 relative">
              <p className="text-sm text-muted-foreground text-center">
                Odpovězte na následující otázky. Vaše odpovědi nám pomohou vytvořit přesné poradenství.
              </p>
              
              <div className="space-y-6">
                {questionnaireQuestions.map((question, index) => (
                  <div key={index} className="space-y-3">
                    <p className="text-sm font-medium text-foreground">
                      {index + 1}. {question}
                    </p>
                    <RadioGroup
                      value={questionnaireResponses[index] || ""}
                      onValueChange={(value) => handleQuestionnaireResponse(index, value)}
                    >
                      {responseOptions.map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`${index}-${option}`} />
                          <Label htmlFor={`${index}-${option}`} className="text-sm cursor-pointer">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowQuestionnaire(false)}
                  className="flex-1"
                >
                  Zrušit
                </Button>
                <Button
                  onClick={handleQuestionnaireSubmit}
                  disabled={!allQuestionsAnswered}
                  className="flex-1 bg-gradient-accent"
                >
                  Odeslat dotazník
                </Button>
              </div>
              
              {/* Floating incomplete submit button sticky to content bottom */}
              {Object.keys(questionnaireResponses).length > 0 && !allQuestionsAnswered && (
                <div className="sticky bottom-0 flex justify-end p-4 bg-gradient-to-t from-background to-transparent">
                  <Button
                    onClick={handleQuestionnaireSubmit}
                    className="bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-lg hover:shadow-xl transition-all duration-300 rounded-full px-6 py-3"
                  >
                    Odeslat (neúplné)
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
          
          {/* Floating incomplete submit button fixed to viewport bottom - outside scrollable content */}
          {showQuestionnaire && Object.keys(questionnaireResponses).length > 0 && !allQuestionsAnswered && (
            <div className="fixed bottom-4 right-4 z-50">
              <Button
                onClick={handleQuestionnaireSubmit}
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-lg hover:shadow-xl transition-all duration-300 rounded-full px-6 py-3"
              >
                Odeslat (neúplné)
              </Button>
            </div>
          )}
        </Dialog>
    </div>
  );
};

export default Index;