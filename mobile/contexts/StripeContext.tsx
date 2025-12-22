import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { StripeProvider as StripeProviderNative } from '@stripe/stripe-react-native';
import { Platform } from 'react-native';

// Stripe Publishable Key
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51R1EmwBn4R59TxYixPJgLpUa5fvifCupEwwcADYLnsSfe1cZWZ8iCGFT3jHOwbZNs9bg4VpYxQIFfs0UPxDmowim00w3KNVrh7';

interface StripeContextType {
    isStripeReady: boolean;
}

const StripeContext = createContext<StripeContextType>({ isStripeReady: false });

export const useStripeContext = () => useContext(StripeContext);

interface Props {
    children: ReactNode;
}

export const StripeProvider: React.FC<Props> = ({ children }) => {
    const [isStripeReady, setIsStripeReady] = useState(false);

    useEffect(() => {
        // Stripe is ready once the provider mounts
        setIsStripeReady(true);
    }, []);

    return (
        <StripeProviderNative
            publishableKey={STRIPE_PUBLISHABLE_KEY}
            merchantIdentifier="merchant.com.vrumi.connect"
            urlScheme="vrumi" // Deep linking scheme from app.json
        >
            <StripeContext.Provider value={{ isStripeReady }}>
                {children}
            </StripeContext.Provider>
        </StripeProviderNative>
    );
};

export default StripeProvider;
