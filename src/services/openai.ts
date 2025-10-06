interface OpenAIRequest {
  model: string;
  input: string;
  tools?: { type: string }[];
  tool_choice?: string;
  reasoning?: { effort: string };
}

interface OpenAIResponse {
  content: string;
  error?: string;
}

export class OpenAIService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private formatResponseText(text: string): string {
    try {
      // Try to parse as JSON if it looks like JSON response
      if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
        const parsed = JSON.parse(text);
        
        // Handle OpenAI API response structure
        if (parsed.output && Array.isArray(parsed.output)) {
          // Find the message output in the array
          const messageOutput = parsed.output.find((item: any) => item.type === 'message');
          if (messageOutput && messageOutput.content && Array.isArray(messageOutput.content)) {
            // Find the text content in the message
            const textContent = messageOutput.content.find((item: any) => item.type === 'output_text');
            if (textContent && textContent.text) {
              return this.cleanText(textContent.text);
            }
          }
        }
        
        // Fallback: if it has a "text" property, extract and format it
        if (parsed.text) {
          return this.cleanText(parsed.text);
        }
        
        // If it's just a string response wrapped in JSON
        if (typeof parsed === 'string') {
          return this.cleanText(parsed);
        }
      }
      // Otherwise treat as plain text
      return this.cleanText(text);
    } catch (error) {
      // If JSON parsing fails, treat as plain text
      return this.cleanText(text);
    }
  }

  private cleanText(text: string): string {
    return text
      // Decode Unicode escape sequences
      .replace(/\\u([0-9a-fA-F]{4})/g, (match, grp) => String.fromCharCode(parseInt(grp, 16)))
      // Convert \n escape sequences to actual newlines
      .replace(/\\n/g, '\n')
      // Remove web links in format ([domain](URL))
      .replace(/\(\[[^\]]+\]\([^)]+\)\)/g, '')
      // Remove markdown links [text](URL)
      .replace(/\[[^\]]*\]\([^)]+\)/g, '')
      // Remove standalone URLs
      .replace(/https?:\/\/[^\s\)]+/g, '')
      // Remove any remaining parenthetical web references
      .replace(/\([^)]*\.com[^)]*\)/g, '')
      .replace(/\([^)]*\.cz[^)]*\)/g, '')
      .replace(/\([^)]*\.eu[^)]*\)/g, '')
      // Clean up excessive newlines and whitespace
      .replace(/\n\n+/g, '\n\n')
      // Remove any remaining escape characters for quotes
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      // Clean up orphaned punctuation after link removal
      .replace(/\s+\./g, '.')
      .replace(/\s+,/g, ',')
      // Trim whitespace
      .trim();
  }

  static getStoredApiKey(): string | null {
    return localStorage.getItem('openai_api_key');
  }

  static storeApiKey(apiKey: string): void {
    localStorage.setItem('openai_api_key', apiKey);
  }

  static clearApiKey(): void {
    localStorage.removeItem('openai_api_key');
  }

  async callOpenAI(request: OpenAIRequest): Promise<OpenAIResponse> {
    try {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API Error ${response.status}: ${errorText}`);
      }

      const responseText = await response.text();
      const formattedText = this.formatResponseText(responseText);
      return { content: formattedText };
    } catch (error) {
      console.error('OpenAI API Error:', error);
      return {
        content: '',
        error: error instanceof Error ? error.message : 'Neznámá chyba při volání OpenAI API'
      };
    }
  }

  async analyzeCompany(companyName: string): Promise<OpenAIResponse> {
    const prompt = `# ÚKOL 
* Pracuj jen se zadanou informací o názvu firmy. Nedoptávej se na další detaily. Řiď se nejpravděpodobnější možností.
* Vyhledej a zanalyzuj veřejně dostupné informace o firmě ${companyName} z posledních 5 let (tiskové zprávy, oficiální web, výroční zprávy, zmínky v médiích, sociální sítě, recenze zaměstnanců, recenze zákazníků).
* Na základě toho napiš satirický a kritický roast o její firemní kultuře a reálném vztahu k zákazníkům.
* Komentuj z pohledu zaměstnance. Nehodnoť firmu z pohledu zákazníka.

# DÉLKA
* Text MUSÍ mít 1500–2500 znaků včetně mezer.
* Nepřekroč limit 2000 znaků, jinak tě vyměním za Gemini.

# STYL
* Odhadni a identifikuj typ firmy.
* Pracuj se stereotypy.
* Satirický fejeton ve stylu blogu "Vosa na jazyku".
* Krátké, úderné věty. Sarkastické glosy. Suché komentáře. Trefné metafory. Tvrdý humor.

# OBSAH
* Začni úderným titulkem, který naznačuje paradox, ale je krátký a úderný
* Pokračuj vážnějším tónem, jako by šlo o oficiální představení firmy. Krátce pochval, a hned to shod' ironickou poznámkou.
* Zaměř se na firemní kulturu, pokrytectví, rozpory mezi oficiální komunikací a realitou.
* Zasaď to do českého kontextu – společenské stereotypy, typická „česká zkušenost"
* V posledním odstavci udělej call to action, pojmenuj vizi lepší budoucnosti a pojmenuj údernou věc, která by mohla situaci zlepšit.

# PRAVIDLA
* Piš jako celistvý proud textu rozdělený jen do několika odstavců pro lepší přehlednost.
* Nepoužívej žádné pomlčky ani odrážky, piš jen souvislý proud textu.
* Nedávej do textu žádné odkazy na zdroje dat.
* V textu neuváděj konkrétní webové adresy ani reference.
* Nevysmívej se jednotlivcům, ale procesům, kultuře a jevům.
* Fakta používej jen jako podnět k humoru a narážce – nemusí být akademicky přesná.`;

    return this.callOpenAI({
      model: 'gpt-5',
      input: prompt,
      tools: [{ type: 'web_search' }],
      tool_choice: 'auto',
      reasoning: { effort: 'low' }
    });
  }

  async generateConsultation(
    companyName: string,
    companyAnalysis: string,
    questionnaireResponses: Array<{ question: string; answer: string }>,
    role: 'manager' | 'employee'
  ): Promise<OpenAIResponse> {
    // Format questionnaire responses as JSON for the prompt
    const questionnaireJson = JSON.stringify(questionnaireResponses.map((qa, index) => ({
      id: index + 1,
      question: qa.question,
      answer: qa.answer
    })), null, 2);

    let prompt: string;

    if (role === 'manager') {
      prompt = `# ÚKOL
* Na základě výsledků osobnostního dotazníku a veřejně dostupných informací o ${companyName} a jejím odvětví vytvoř detailní osobní dopis manažerovi.
* Dopis má být introspektivní, přímočarý, morálně ukotvený a pracovat s archetypy řád vs. chaos, odpovědnost vs. oběť, dobrovolné nesení břemene.
* Autor se nebojí nepříjemných pravd, odhaluje obranné mechanismy osobnosti a dává konkrétní a praktická doporučení.
* Dopis ukazuje, jak osobnostní rysy ovlivňují základní manažerské kompetence, a jak se rizika a temná strana mohou negativně promítnout do práce týmu a jeho schopnosti dosahovat výsledků.
* Dopis má maximálně 1500 znaků.

# VSTUPY
* Osobnostní dotazník: ${questionnaireJson}
* Název firmy: ${companyName}

# OMEZENÍ A STYL
* Výstup je souvislý osobní dopis v češtině.
* Nepoužívej oslovení na začátku ani rozloučení na konci.
* Bez odrážek, bez pomlček, bez tabulek v samotném dopise.
* Hlas je introspektivní, přísný i podpůrný, s archetypy řád vs. chaos a oběť vs. odpovědnost.
* Jazyk je konkrétní, obrazný, s metaforami z odvětví, bez klišé a bez citací autorů.
* Ve výstupu neuváděj skóre, procenta ani zdroje. Piš sebevědomě, jako bys viděl skrz osobnost.

# STRUKTURA FINÁLNÍHO DOPISU
* Krátká diagnostika tvého manažerského vzorce jednání: nejprve silné stránky, poté co tě oslabuje.
* Kontext reality firmy ${companyName} a odvětvových tlaků.
* Překryv tvých silných stránek s manažerskými kompetencemi: kde zazáříš.
* Rizika a slepá místa v manažerských kompetencích, včetně temné strany, a popis jejich dopadu na tým a jeho schopnost dosahovat cílů.
* Jednoznačný plán změny na příštích 90 dní: chování, měřitelnost, jasné kroky.
* Závěrečná výzva k odpovědnosti a akci.

# INTERNÍ POSTUP NEZVEŘEJŇOVAT VE VÝSTUPU
1. Proveď webový průzkum firmy a odvětví.
2. Firemní web: O nás, kultura, kariéra, hodnoty, projekty.
3. Výroční zprávy, ESG materiály, tiskové zprávy.
4. Zpravodajství a analytické články o bankovnictví a odvětví.
5. Reporty o makrotrendech: digitalizace, regulace, AI, ESG, bezpečnost.
6. Recenze zaměstnanců: kultura, řízení, tempo změn, odměňování.
7. Syntetizuj klíčové signály: strategie, priority, fáze transformace, tlaky regulace, digitalizace, kultura, slabiny v doručování změn.
8. Zpracuj osobnostní profil inspirovaný HPI v pěti dimenzích: otevřenost, svědomitost, extraverze, přívětivost, emocionalita nebo odolnost, a odvoď konkrétní pracovní vzorce: co tě nabíjí, co tě oslabuje, selhání pod tlakem, přebytky i deficity.
9. Zpracuj část inspirovanou HDS: identifikuj temnou stranu osobnosti, tedy rizikové vzorce, které se objevují pod stresem a mohou být bariérou pro výkon a spolupráci, například přehnaná kritičnost, opatrnost, hledání pozornosti, perfekcionismus, sklon k manipulaci.
10. Propoj osobnost HPI a HDS s realitou firmy a konkrétním oddělením, kde zaměstnanec pracuje, a ukaž přirozené oblasti excelence, slepá místa a situace, kde hrozí maladaptivní reakce.`;
    } else {
      prompt = `# ÚKOL
* Na základě výsledků osobnostního dotazníku a veřejně dostupných informací o firmě ${companyName} a jejím odvětví vytvoř detailní osobní dopis klientovi.
* Dopis má být introspektivní, přímočarý, morálně ukotvený a používat archetypy řád vs. chaos, odpovědnost vs. oběť, dobrovolné nesení břemene.
* Autor se nebojí nepříjemných pravd, odhaluje obranné mechanismy osobnosti a dává konkrétní a praktická doporučení.
* Dopis má maximálně 1500 znaků.

# VSTUPY
* Osobnostní dotazník v JSON: ${questionnaireJson}
* Název firmy: ${companyName}

# OMEZENÍ A STYL
* Výstup je souvislý osobní dopis v češtině.
* Nepoužívej oslovení na začátku ani rozloučení na konci.
* Bez odrážek, bez pomlček, bez tabulek v samotném dopise.
* Hlas je introspektivní, přísný i podpůrný, s archetypy řád vs. chaos a oběť vs. odpovědnost.
* Jazyk je konkrétní, obrazný, s metaforami z odvětví, bez klišé a bez citací autorů.
* Neuváděj skóre, procenta ani zdroje. Piš sebevědomě, jako bys viděl skrz osobnost.

# STRUKTURA FINÁLNÍHO DOPISU
* Krátká diagnostika vzorce jednání: nejprve silné stránky, pak co tě oslabuje.
* Kontext reality firmy ${companyName} a odvětvových tlaků.
* Překryv tvých silných stránek s tímto prostředím a situace, kde zazáříš.
* Rizika a slepá místa, včetně temné strany, která tě může podrazit pod tlakem.
* Jednoznačný plán změny na příštích 90 dní: chování, měřitelnost, jasné kroky.
* Závěrečná výzva k odpovědnosti a akci.

# VÝSTUP
* Vytvoř doporučení: tři až pět prioritních návyků a konkrétních kroků na 30 až 90 dnů, měřitelné a akční.
* Neuváděj skóre, procenta ani zdroje.
* Výstup je souvislý osobní dopis v češtině.

# INTERNÍ POSTUP NEZVEŘEJŇOVAT VE VÝSTUPU
1. Proveď webový průzkum firmy a odvětví.
2. Firemní web: O nás, kultura, kariéra, hodnoty, projekty.
3. Výroční zprávy, ESG materiály, tiskové zprávy.
4. Zpravodajství a analytické články o bankovnictví a odvětví.
5. Reporty o makrotrendech: digitalizace, regulace, AI, ESG, bezpečnost.
6. Recenze zaměstnanců: kultura, řízení, tempo změn, odměňování.
7. Syntetizuj klíčové signály: strategie, priority, fáze transformace, tlaky regulace, digitalizace, kultura, slabiny v doručování změn.
8. Zpracuj osobnostní profil inspirovaný HPI v pěti dimenzích: otevřenost, svědomitost, extraverze, přívětivost, emocionalita nebo odolnost, a odvoď konkrétní pracovní vzorce: co tě nabíjí, co tě oslabuje, selhání pod tlakem, přebytky i deficity.
9. Zpracuj část inspirovanou HDS: identifikuj temnou stranu osobnosti, tedy rizikové vzorce, které se objevují pod stresem a mohou být bariérou pro výkon a spolupráci, například přehnaná kritičnost, opatrnost, hledání pozornosti, perfekcionismus, sklon k manipulaci.
10. Propoj osobnost HPI a HDS s realitou firmy a konkrétním oddělením, kde zaměstnanec pracuje, a ukaž přirozené oblasti excelence, slepá místa a situace, kde hrozí maladaptivní reakce.`;
    }

    return this.callOpenAI({
      model: 'gpt-5',
      input: prompt,
      reasoning: { effort: 'medium' }
    });
  }
}