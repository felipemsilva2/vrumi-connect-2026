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

const defaultTitle = 'Vrumi - Tire sua CNH Estudando Sozinho | Autoescola Digital 2025';
const defaultDescription = 'Prepare-se para o exame da CNH sem autoescola. A nova lei permite estudar sozinho! Simulados DETRAN, 136 placas de trânsito, flashcards inteligentes. Taxa de aprovação de 95%.';
const defaultKeywords = 'CNH, carteira de motorista, exame de habilitação, DETRAN, prova teórica CNH, simulado DETRAN, placas de trânsito, autoescola online, tirar CNH sozinho';
const siteUrl = 'https://vrumi.com.br';

export const SEOHead = ({
  title,
  description = defaultDescription,
  keywords = defaultKeywords,
  canonical,
  ogImage = '/logo-vrumi.png',
  ogType = 'website',
  noIndex = false,
}: SEOHeadProps) => {
  const fullTitle = title ? `${title} | Vrumi` : defaultTitle;
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
      <meta property="og:site_name" content="Vrumi" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullOgImage} />
    </Helmet>
  );
};

export default SEOHead;