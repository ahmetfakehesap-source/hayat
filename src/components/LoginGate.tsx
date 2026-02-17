import React, { useState } from 'react';

interface LoginGateProps {
    password: string;
    children: React.ReactNode;
}

const LoginGate: React.FC<LoginGateProps> = ({ password, children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return localStorage.getItem('hayat_auth') === 'true';
    });
    const [inputPassword, setInputPassword] = useState('');
    const [error, setError] = useState('');
    const [shake, setShake] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputPassword === password) {
            localStorage.setItem('hayat_auth', 'true');
            setIsAuthenticated(true);
        } else {
            setError('Yanlış şifre!');
            setShake(true);
            setTimeout(() => setShake(false), 500);
            setInputPassword('');
        }
    };

    if (isAuthenticated) {
        return <>{children}</>;
    }

    return (
        <div style={styles.overlay}>
            <div style={{
                ...styles.card,
                animation: shake ? 'shake 0.5s ease-in-out' : 'fadeInUp 0.6s ease-out',
            }}>
                <div style={styles.lockIcon}>🔒</div>
                <h1 style={styles.title}>Hayat Simülasyonu</h1>
                <p style={styles.subtitle}>Bu site özel erişime sahiptir</p>
                <form onSubmit={handleSubmit} style={styles.form}>
                    <input
                        type="password"
                        value={inputPassword}
                        onChange={(e) => {
                            setInputPassword(e.target.value);
                            setError('');
                        }}
                        placeholder="Şifre girin..."
                        style={styles.input}
                        autoFocus
                    />
                    {error && <p style={styles.error}>{error}</p>}
                    <button type="submit" style={styles.button}>
                        Giriş Yap
                    </button>
                </form>
            </div>
            <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }
        .login-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(99, 102, 241, 0.5) !important;
        }
      `}</style>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #0f0c29 0%, #1a1a3e 50%, #24243e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
    },
    card: {
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        padding: '48px 40px',
        width: '380px',
        maxWidth: '90vw',
        textAlign: 'center' as const,
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
    },
    lockIcon: {
        fontSize: '48px',
        marginBottom: '16px',
    },
    title: {
        color: '#ffffff',
        fontSize: '24px',
        fontWeight: 700,
        margin: '0 0 8px 0',
        letterSpacing: '-0.5px',
    },
    subtitle: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: '14px',
        margin: '0 0 32px 0',
    },
    form: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '16px',
    },
    input: {
        background: 'rgba(255, 255, 255, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '12px',
        padding: '14px 18px',
        fontSize: '16px',
        color: '#ffffff',
        outline: 'none',
        transition: 'border-color 0.3s, box-shadow 0.3s',
        width: '100%',
        boxSizing: 'border-box' as const,
    },
    button: {
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        border: 'none',
        borderRadius: '12px',
        padding: '14px',
        fontSize: '16px',
        fontWeight: 600,
        color: '#ffffff',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        letterSpacing: '0.5px',
    },
    error: {
        color: '#f87171',
        fontSize: '13px',
        margin: 0,
    },
};

export default LoginGate;
