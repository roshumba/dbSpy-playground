import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import Sidebar from '../../src/components/DBDisplay/Sidebar';

const renderSidebar = () => {
  const view = render(<Sidebar closeNav={jest.fn()} />);
  const linkInput = view.container.querySelector(
    'input[name="database_link"]'
  ) as HTMLInputElement;
  return { ...view, linkInput };
};

describe('Sidebar Connect', () => {
  afterEach(() => jest.restoreAllMocks());

  it('tells the user the link must include a username and password', () => {
    renderSidebar();
    expect(screen.getByText(/Must include username and password/i)).toBeInTheDocument();
  });

  it('sends a Postgres link to the BE unparsed, without split-out credentials', async () => {
    const mockGet = jest
      .spyOn(axios, 'get')
      .mockResolvedValue({ data: { schema: {}, data: {} } });
    const { linkInput } = renderSidebar();

    // a raw @ in the password: the old browser-side split cut this at the wrong @
    const link = 'postgres://ana:p@ss@db.example.com:5432/shop?sslmode=require';
    await userEvent.type(linkInput, link);
    await userEvent.click(screen.getByRole('button', { name: /Connect/i }));

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));
    expect(mockGet).toHaveBeenCalledWith('/api/sql/postgres/schema', {
      params: { db_type: 'postgres', database_link: link },
    });
  });

  it("shows the server's error message and stops the spinner when the BE rejects the link", async () => {
    jest.spyOn(axios, 'get').mockRejectedValue(
      Object.assign(new Error('Request failed with status code 400'), {
        isAxiosError: true,
        response: { status: 400, data: 'Username and password are required' },
      })
    );
    const { linkInput } = renderSidebar();

    await userEvent.type(linkInput, 'postgres://localhost/shop');
    await userEvent.click(screen.getByRole('button', { name: /Connect/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Username and password are required'
    );
    expect(screen.queryByText(/Loading\.\.\./i)).not.toBeInTheDocument();
  });
});
