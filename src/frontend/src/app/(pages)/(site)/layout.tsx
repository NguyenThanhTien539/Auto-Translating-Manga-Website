import Header from "@/components/Header/Header";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      {children}
      {/* <Footer/> */}
    </>
  );
}
