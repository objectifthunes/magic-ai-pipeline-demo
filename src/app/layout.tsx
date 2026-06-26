import type { Metadata } from "next";
import "@objectifthunes/whiteboard/style.css";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Magic AI Pipeline — SDK reference",
  description:
    "Describe an AI pipeline in plain English, get a validated, provider-agnostic workflow. The live, source-paired reference for the Magic AI Pipeline stack: ai-core, ai-workflow and the provider adapters.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
