import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Component tests for the question builder
// Tests the add/delete/reorder functionality of the shop owner's question creator

describe('QuestionBuilder Component', () => {
  it('should render with fixed name and phone fields', async () => {
    const { QuestionBuilder } = await import('@/components/QuestionBuilder');
    render(<QuestionBuilder questions={[]} onChange={vi.fn()} />);

    expect(screen.getByText('고객 이름')).toBeInTheDocument();
    expect(screen.getByText('고객 전화번호')).toBeInTheDocument();
  });

  it('should add a new text question', async () => {
    const { QuestionBuilder } = await import('@/components/QuestionBuilder');
    const onChange = vi.fn();
    render(<QuestionBuilder questions={[]} onChange={onChange} />);

    const addButton = screen.getByRole('button', { name: /질문 추가/i });
    await userEvent.click(addButton);

    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ type: 'text', title: '' }),
      ])
    );
  });

  it('should delete a custom question', async () => {
    const { QuestionBuilder } = await import('@/components/QuestionBuilder');
    const onChange = vi.fn();
    const questions = [
      { id: 'q1', type: 'text' as const, title: '원하는 시간', options: [''], required: true },
    ];
    render(<QuestionBuilder questions={questions} onChange={onChange} />);

    const deleteButton = screen.getByLabelText('삭제');
    await userEvent.click(deleteButton);

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('should change question type from text to radio', async () => {
    const { QuestionBuilder } = await import('@/components/QuestionBuilder');
    const onChange = vi.fn();
    const questions = [
      { id: 'q1', type: 'text' as const, title: '인원수', options: [''], required: false },
    ];
    render(<QuestionBuilder questions={questions} onChange={onChange} />);

    const typeSelect = screen.getByDisplayValue('주관식');
    await userEvent.selectOptions(typeSelect, 'radio');

    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 'q1', type: 'radio' }),
      ])
    );
  });

  it('should add options to a radio question', async () => {
    const { QuestionBuilder } = await import('@/components/QuestionBuilder');
    const onChange = vi.fn();
    const questions = [
      { id: 'q1', type: 'radio' as const, title: '인원수', required: false, options: ['1명'] },
    ];
    render(<QuestionBuilder questions={questions} onChange={onChange} />);

    const addOptionButton = screen.getByRole('button', { name: /옵션 추가/i });
    await userEvent.click(addOptionButton);

    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 'q1', options: ['1명', ''] }),
      ])
    );
  });

  it('should render multiple questions', async () => {
    const { QuestionBuilder } = await import('@/components/QuestionBuilder');
    const onChange = vi.fn();
    const questions = [
      { id: 'q1', type: 'text' as const, title: '질문1', options: [''], required: false },
      { id: 'q2', type: 'text' as const, title: '질문2', options: [''], required: false },
    ];
    render(<QuestionBuilder questions={questions} onChange={onChange} />);

    expect(screen.getByDisplayValue('질문1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('질문2')).toBeInTheDocument();
  });

  it('should toggle required flag on custom question', async () => {
    const { QuestionBuilder } = await import('@/components/QuestionBuilder');
    const onChange = vi.fn();
    const questions = [
      { id: 'q1', type: 'text' as const, title: '요청사항', options: [''], required: false },
    ];
    render(<QuestionBuilder questions={questions} onChange={onChange} />);

    // The required checkbox is rendered with label "필수"
    const requiredCheckbox = screen.getByRole('checkbox');
    await userEvent.click(requiredCheckbox);

    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 'q1', required: true }),
      ])
    );
  });
});
