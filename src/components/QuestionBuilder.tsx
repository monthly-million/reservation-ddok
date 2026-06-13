'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface QuestionItem {
  id: string;
  type: 'text' | 'radio' | 'image';
  title: string;
  options: string[];
  required: boolean;
}

interface QuestionBuilderProps {
  questions: QuestionItem[];
  onChange: (questions: QuestionItem[]) => void;
}

function SortableQuestion({
  question,
  onUpdate,
  onDelete,
}: {
  question: QuestionItem;
  onUpdate: (q: QuestionItem) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 touch-none"
          {...attributes}
          {...listeners}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
            <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
          </svg>
        </button>

        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <select
              value={question.type}
              onChange={(e) => onUpdate({ ...question, type: e.target.value as QuestionItem['type'] })}
              className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white"
            >
              <option value="text">주관식</option>
              <option value="radio">객관식</option>
              <option value="image">이미지첨부</option>
            </select>
            <label className="flex items-center gap-1 text-xs text-gray-500 ml-auto">
              <input
                type="checkbox"
                checked={question.required}
                onChange={(e) => onUpdate({ ...question, required: e.target.checked })}
                className="rounded border-gray-300"
              />
              필수
            </label>
          </div>

          <input
            type="text"
            value={question.title}
            onChange={(e) => onUpdate({ ...question, title: e.target.value })}
            placeholder="질문을 입력하세요"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
          />

          {question.type === 'radio' && (
            <div className="space-y-2">
              {question.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">○</span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...question.options];
                      newOpts[i] = e.target.value;
                      onUpdate({ ...question, options: newOpts });
                    }}
                    placeholder={`옵션 ${i + 1}`}
                    className="flex-1 border-b border-gray-200 px-1 py-1 text-sm focus:outline-none focus:border-[#FF6B35]"
                  />
                  {question.options.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newOpts = question.options.filter((_, idx) => idx !== i);
                        onUpdate({ ...question, options: newOpts });
                      }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => onUpdate({ ...question, options: [...question.options, ''] })}
                className="text-xs text-[#FF6B35] hover:underline"
              >
                + 옵션 추가
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onDelete}
          className="text-gray-400 hover:text-red-500 p-1"
          aria-label="삭제"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

let nextId = 1;
function genId() {
  return `q_${Date.now()}_${nextId++}`;
}

export function QuestionBuilder({ questions, onChange }: QuestionBuilderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over.id);
      onChange(arrayMove(questions, oldIndex, newIndex));
    }
  }

  function addQuestion() {
    onChange([
      ...questions,
      { id: genId(), type: 'text', title: '', options: [''], required: false },
    ]);
  }

  function updateQuestion(id: string, updated: QuestionItem) {
    onChange(questions.map((q) => (q.id === id ? updated : q)));
  }

  function deleteQuestion(id: string) {
    onChange(questions.filter((q) => q.id !== id));
  }

  return (
    <div className="space-y-3">
      {/* Fixed fields - shown as disabled */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 opacity-60">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">고정</span>
            <span className="text-sm text-gray-600">고객 이름</span>
            <span className="text-xs text-red-400 ml-auto">필수</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">고정</span>
            <span className="text-sm text-gray-600">고객 전화번호</span>
            <span className="text-xs text-red-400 ml-auto">필수</span>
          </div>
        </div>
      </div>

      {/* Custom questions */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
          {questions.map((q) => (
            <SortableQuestion
              key={q.id}
              question={q}
              onUpdate={(updated) => updateQuestion(q.id, updated)}
              onDelete={() => deleteQuestion(q.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      <button
        type="button"
        onClick={addQuestion}
        className="w-full border-2 border-dashed border-gray-300 rounded-xl py-3 text-sm text-gray-500 hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors"
      >
        + 질문 추가
      </button>
    </div>
  );
}

export default QuestionBuilder;
