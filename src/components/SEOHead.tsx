import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  noIndex?: boolean;
}

const defaultTitle = 'Instrutor Independente de Direção | Aulas Particulares CNH | Vrumi Connect';
const defaultDescription = 'Encontre instrutores independentes credenciados pelo DETRAN. Nova Lei CNH 2025: aulas práticas particulares, economia de até 80%, agendamento online. Saiba mais sobre CNH grátis e instrutor autônomo.';
const defaultKeywords = 'instrutor independente, instrutor autônomo, aulas de direção, instrutor particular de direção, CNH grátis, CNH social, nova lei CNH 2025, Lei 14.599/2023, instrutor credenciado DETRAN, aula prática CNH, carteira de motorista, agendar aula direção';
const siteUrl = 'https://www.vrumi.com.br';

export const SEOHead = ({
  title,
  description = defaultDescription,
  keywords = defaultKeywords,
  canonical,
  ogImage = '/logo-vrumi.png',
  ogType = 'website',
  noIndex = false,
}: SEOHeadProps) => {
  const fullTitle = title ? `${title} | Vrumi Connect` : defaultTitle;
  const fullCanonical = canonical ? `${siteUrl}${canonical}` : siteUrl;
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={fullCanonical} />

      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:locale" content="pt_BR" />
      <meta property="og:site_name" content="Vrumi Connect" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullOgImage} />
    </Helmet>
  );
};

export default SEOHead;