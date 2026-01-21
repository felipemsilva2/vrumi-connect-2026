import '@testing-library/react-native/extend-expect';

// Mock de módulos nativos que podem causar problemas nos testes
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
    }),
    useSegments: () => [],
    usePathname: () => '/',
}));

jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(),
    setItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
}));

// Mock global
global.fetch = jest.fn();
