import React from 'react';

const SimpleTest: React.FC = () => {
  return (
    <div style={{ padding: '50px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: 'green' }}>✅ ROTA FUNCIONANDO!</h1>
      <p>Esta é uma página de teste simples.</p>
      <p>Se você está vendo isto, o roteamento está funcionando corretamente.</p>
      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <h3>Informações da Rota:</h3>
        <p><strong>Path:</strong> {window.location.pathname}</p>
        <p><strong>URL Completa:</strong> {window.location.href}</p>
      </div>
      <div style={{ marginTop: '20px' }}>
        <a href="/" style={{ marginRight: '10px', color: 'blue' }}>← Voltar para Home</a>
        <a href="/register" style={{ marginRight: '10px', color: 'blue' }}>Testar Registro</a>
      </div>
    </div>
  );
};

export default SimpleTest;