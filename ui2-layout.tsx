import "./globals.css";
import ProductShell from "./components/ProductShell";

export const metadata={title:"BOTNOI Agent Builder",description:"Design, prompt and test chatbot/voicebot agents"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><ProductShell>{children}</ProductShell></body></html>}
