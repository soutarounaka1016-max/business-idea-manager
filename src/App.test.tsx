import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  vi.spyOn(window, 'alert').mockImplementation(() => undefined);
});

describe('App', () => {
  it('初期ダッシュボードとアイデアを表示する', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: '事業アイデア管理' })).toBeInTheDocument();
    expect(screen.getAllByText('個人塾向けAI受付').length).toBeGreaterThan(0);
    expect(screen.getByText('サッカー観戦アプリ')).toBeInTheDocument();
  });

  it('アイデアを追加して検索できる', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByTestId('add-idea-button'));
    await user.type(screen.getByTestId('idea-name-input'), '高校生向け事業テスト');
    await user.type(screen.getByTestId('idea-industry-input'), '教育');
    await user.click(screen.getByTestId('save-idea-button'));

    await user.click(screen.getByLabelText('閉じる'));
    expect(screen.getByText('高校生向け事業テスト')).toBeInTheDocument();
    await user.type(screen.getByLabelText('アイデア検索'), '高校生向け');
    expect(screen.getByText('高校生向け事業テスト')).toBeInTheDocument();
    expect(screen.queryByText('サッカー観戦アプリ')).not.toBeInTheDocument();
  });
});
