export interface StudyMaterial {
    id: string;
    state: string; // UF or "Geral"
    title: string;
    url: string;
    type: 'manual' | 'simulado' | 'legislacao';
}

const states = [
    { uf: 'AC', name: 'Acre' },
    { uf: 'AL', name: 'Alagoas' },
    { uf: 'AP', name: 'Amapá' },
    { uf: 'AM', name: 'Amazonas' },
    { uf: 'BA', name: 'Bahia' },
    { uf: 'CE', name: 'Ceará' },
    { uf: 'DF', name: 'Distrito Federal' },
    { uf: 'ES', name: 'Espírito Santo' },
    { uf: 'GO', name: 'Goiás' },
    { uf: 'MA', name: 'Maranhão' },
    { uf: 'MT', name: 'Mato Grosso' },
    { uf: 'MS', name: 'Mato Grosso do Sul', specific: true },
    { uf: 'MG', name: 'Minas Gerais' },
    { uf: 'PA', name: 'Pará' },
    { uf: 'PB', name: 'Paraíba' },
    { uf: 'PR', name: 'Paraná' },
    { uf: 'PE', name: 'Pernambuco' },
    { uf: 'PI', name: 'Piauí' },
    { uf: 'RJ', name: 'Rio de Janeiro' },
    { uf: 'RN', name: 'Rio Grande do Norte' },
    { uf: 'RS', name: 'Rio Grande do Sul', specific: true },
    { uf: 'RO', name: 'Rondônia' },
    { uf: 'RR', name: 'Roraima' },
    { uf: 'SC', name: 'Santa Catarina' },
    { uf: 'SP', name: 'São Paulo' },
    { uf: 'SE', name: 'Sergipe' },
    { uf: 'TO', name: 'Tocantins' },
];

export const STUDY_MATERIALS: StudyMaterial[] = [
    {
        id: 'default-manual-2025',
        state: 'Geral',
        title: 'Manual de Obtenção da CNH 2025 (Geral)',
        url: '/materiais/MANUAL-OBTENCAO_2025.pdf',
        type: 'manual'
    },
    ...states.map(state => {
        let url = '/materiais/MANUAL-OBTENCAO_2025.pdf'; // Default fallback
        let title = `Apostila Detran ${state.uf} (Genérica)`;

        // Specific PDFs can be added here in the future
        // if (state.uf === 'MS') { ... }

        return {
            id: `${state.uf.toLowerCase()}-manual`,
            state: state.uf,
            title: title,
            url: url,
            type: 'manual' as const
        };
    })
];
