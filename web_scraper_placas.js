// Web Scraper para Extrair Placas de Trânsito do Brasil
// Execute este script no console do navegador na página:
// https://blog.sinalcenter.com.br/placas-de-transito-e-seus-significados/

(function() {
    'use strict';

    console.log('🚦 Iniciando web scraper de placas de trânsito...');

    // Função para limpar texto
    function cleanText(text) {
        if (!text) return '';
        return text
            .replace(/\n+/g, ' ') // Remove quebras de linha extras
            .replace(/\s+/g, ' ') // Remove espaços múltiplos
            .replace(/\t+/g, ' ') // Remove tabs
            .trim();
    }

    // Função para extrair código da placa (ex: R-1, A-1a, etc)
    function extractCode(text) {
        if (!text) return '';
        // Procura por padrões como R-1, A-1a, R-2b, etc.
        const match = text.match(/([A-Z]+-\d+[a-z]?)/i);
        return match ? match[1].toUpperCase() : '';
    }

    // Função para determinar a categoria baseada no código
    function getCategory(code) {
        if (!code) return 'Outros';
        const prefix = code.charAt(0).toUpperCase();
        
        switch (prefix) {
            case 'R': return 'Regulamentação';
            case 'A': return 'Advertência';
            case 'S': return 'Serviços Auxiliares';
            case 'I': return 'Indicação';
            case 'O': return 'Obras';
            default: return 'Outros';
        }
    }

    // Função para extrair URL da imagem
    function extractImageUrl(imgElement) {
        if (!imgElement) return '';
        
        // Tenta diferentes atributos de imagem
        let src = imgElement.getAttribute('src') || 
                  imgElement.getAttribute('data-src') || 
                  imgElement.getAttribute('data-lazy-src') || '';
        
        // Se não encontrar src, procura no elemento pai
        if (!src) {
            const parentLink = imgElement.closest('a');
            if (parentLink) {
                src = parentLink.getAttribute('href') || '';
            }
        }
        
        // Converte para URL absoluta se for relativa
        if (src && !src.startsWith('http')) {
            if (src.startsWith('//')) {
                src = 'https:' + src;
            } else if (src.startsWith('/')) {
                src = 'https://blog.sinalcenter.com.br' + src;
            } else {
                src = 'https://blog.sinalcenter.com.br/' + src;
            }
        }
        
        return src;
    }

    // Função principal para extrair dados
    function extractTrafficSigns() {
        const placas = [];
        const seenCodes = new Set(); // Para evitar duplicatas

        // Procura por todos os elementos que podem conter informações de placas
        const possibleContainers = [
            ...document.querySelectorAll('table'),
            ...document.querySelectorAll('.wp-block-table'),
            ...document.querySelectorAll('article table'),
            ...document.querySelectorAll('.entry-content table'),
            ...document.querySelectorAll('tr'),
            ...document.querySelectorAll('li'),
            ...document.querySelectorAll('p')
        ];

        console.log(`🔍 Analisando ${possibleContainers.length} possíveis containers...`);

        possibleContainers.forEach((container, index) => {
            try {
                // Procura por imagens dentro do container
                const images = container.querySelectorAll('img');
                
                images.forEach(img => {
                    const imgUrl = extractImageUrl(img);
                    if (!imgUrl) return;

                    // Procura texto próximo à imagem
                    let code = '';
                    let description = '';
                    
                    // Tenta encontrar o código no alt da imagem
                    const altText = img.getAttribute('alt') || '';
                    code = extractCode(altText);
                    
                    // Se não encontrou no alt, procura no texto ao redor
                    if (!code) {
                        // Procura em elementos irmãos e pais
                        let current = img.parentElement;
                        let attempts = 0;
                        
                        while (current && attempts < 3) {
                            const textContent = current.textContent || '';
                            const foundCode = extractCode(textContent);
                            
                            if (foundCode) {
                                code = foundCode;
                                description = textContent;
                                break;
                            }
                            
                            current = current.parentElement;
                            attempts++;
                        }
                    }
                    
                    // Se ainda não encontrou, procura no texto do container
                    if (!code) {
                        const containerText = container.textContent || '';
                        code = extractCode(containerText);
                        if (code) {
                            description = containerText;
                        }
                    }
                    
                    // Se encontrou um código válido, adiciona à lista
                    if (code && !seenCodes.has(code)) {
                        seenCodes.add(code);
                        
                        // Limpa a descrição
                        description = cleanText(description);
                        
                        // Se a descrição estiver muito longa, tenta extrair apenas a parte relevante
                        if (description.length > 200) {
                            const sentences = description.split(/[.!?]/);
                            const firstSentence = sentences[0] || '';
                            if (firstSentence.length > 10 && firstSentence.length < 150) {
                                description = firstSentence + '.';
                            }
                        }
                        
                        // Se a descrição ainda estiver vazia ou muito curta, cria uma baseada no código
                        if (description.length < 10) {
                            description = `Placa de ${getCategory(code).toLowerCase()} ${code}`;
                        }
                        
                        placas.push({
                            code: code,
                            name: description,
                            category: getCategory(code),
                            image_url: imgUrl,
                            description: description
                        });
                        
                        console.log(`✅ Encontrada placa: ${code} - ${getCategory(code)}`);
                    }
                });
                
            } catch (error) {
                console.warn(`⚠️ Erro ao processar container ${index}:`, error);
            }
        });

        // Se não encontrou placas com o método anterior, tenta um método alternativo
        if (placas.length === 0) {
            console.log('🔄 Tentando método alternativo de extração...');
            
            // Procura por todos os elementos de texto que contenham códigos de placa
            const allElements = document.querySelectorAll('*');
            
            allElements.forEach(element => {
                const text = element.textContent || '';
                const codes = text.match(/[A-Z]+-\d+[a-z]?/gi) || [];
                
                codes.forEach(code => {
                    if (!seenCodes.has(code)) {
                        seenCodes.add(code);
                        
                        // Procura imagem próxima
                        let imgUrl = '';
                        const img = element.querySelector('img') || element.closest('*')?.querySelector('img');
                        if (img) {
                            imgUrl = extractImageUrl(img);
                        }
                        
                        // Se não encontrou imagem próxima, procura na página toda
                        if (!imgUrl) {
                            const allImages = document.querySelectorAll('img');
                            for (const image of allImages) {
                                const alt = image.getAttribute('alt') || '';
                                if (alt.includes(code)) {
                                    imgUrl = extractImageUrl(image);
                                    break;
                                }
                            }
                        }
                        
                        placas.push({
                            code: code.toUpperCase(),
                            name: `Placa de ${getCategory(code).toLowerCase()} ${code}`,
                            category: getCategory(code),
                            image_url: imgUrl,
                            description: cleanText(text)
                        });
                        
                        console.log(`✅ Encontrada placa (método 2): ${code}`);
                    }
                });
            });
        }

        return placas;
    }

    // Executa a extração
    console.log('📋 Iniciando extração de dados...');
    const placasExtraidas = extractTrafficSigns();
    
    console.log(`\n📊 Resultados da Extração:`);
    console.log(`✅ Total de placas encontradas: ${placasExtraidas.length}`);
    
    // Agrupa por categoria para estatísticas
    const porCategoria = placasExtraidas.reduce((acc, placa) => {
        acc[placa.category] = (acc[placa.category] || 0) + 1;
        return acc;
    }, {});
    
    console.log(`\n📈 Distribuição por categoria:`);
    Object.entries(porCategoria).forEach(([categoria, quantidade]) => {
        console.log(`   ${categoria}: ${quantidade} placas`);
    });
    
    // Verifica se há imagens válidas
    const comImagem = placasExtraidas.filter(p => p.image_url).length;
    console.log(`\n🖼️ Placas com imagem: ${comImagem}/${placasExtraidas.length}`);
    
    if (placasExtraidas.length === 0) {
        console.warn('⚠️ Nenhuma placa foi encontrada. Verifique se você está na página correta.');
        console.warn('📍 Certifique-se de estar em: https://blog.sinalcenter.com.br/placas-de-transito-e-seus-significados/');
        return;
    }

    // Prepara o JSON final
    const jsonFinal = {
        metadata: {
            total_placas: placasExtraidas.length,
            data_extracao: new Date().toISOString(),
            fonte: 'Blog Sinal Center - Placas de Trânsito',
            url: window.location.href,
            categorias: Object.keys(porCategoria)
        },
        placas: placasExtraidas
    };

    // Converte para JSON string
    const jsonString = JSON.stringify(jsonFinal, null, 2);
    
    // Cria e faz download do arquivo
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'placas_brasil.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('\n✅ Download iniciado: placas_brasil.json');
    console.log(`📄 Tamanho do arquivo: ${(jsonString.length / 1024).toFixed(2)} KB`);
    
    // Mostra exemplo dos primeiros dados
    if (placasExtraidas.length > 0) {
        console.log('\n📝 Exemplo de dados extraídos:');
        console.log(JSON.stringify(placasExtraidas[0], null, 2));
    }
    
    // Retorna os dados para uso adicional se necessário
    return jsonFinal;

})();