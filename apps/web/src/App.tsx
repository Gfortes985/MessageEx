import { FormEvent, useMemo, useState } from 'react';

type Mode = 'login' | 'register';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export function App() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [status, setStatus] = useState('Готово к авторизации');
  const [loading, setLoading] = useState(false);

  const title = useMemo(() => (mode === 'login' ? 'Вход в MessageEx' : 'Создать аккаунт'), [mode]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setStatus('Отправка запроса...');

    const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
    const body = mode === 'login' ? { email, password } : { email, password, displayName };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        setStatus(`Ошибка: ${response.status} ${response.statusText}`);
        return;
      }

      const payload = (await response.json()) as { accessToken?: string };
      setStatus(payload.accessToken ? 'Успешно: токены получены' : 'Успешно: ответ получен');
    } catch (error) {
      setStatus(`Ошибка сети: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <section className="card">
        <p className="brand">MessageEx</p>
        <h1>{title}</h1>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <label>
              Имя
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                minLength={2}
                required
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            Пароль
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </label>

          <button disabled={loading} type="submit">
            {loading ? 'Подождите...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        <button
          className="secondary"
          onClick={() => setMode((prev) => (prev === 'login' ? 'register' : 'login'))}
          type="button"
        >
          {mode === 'login' ? 'Нет аккаунта? Регистрация' : 'Уже есть аккаунт? Войти'}
        </button>

        <p className="status">{status}</p>
      </section>
    </main>
  );
}
