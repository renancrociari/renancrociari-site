import '../../src/editor-ui/styles/global.css';

export const metadata = {
  title: 'Portfolio OS Editor',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
