import { BlogCtaBar } from "./_components/blog-cta-bar";
import { BlogCtaSection } from "./_components/blog-cta-section";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BlogCtaBar />
      {children}
      <div className="container mx-auto px-4 pb-16">
        <BlogCtaSection />
      </div>
    </>
  );
}
