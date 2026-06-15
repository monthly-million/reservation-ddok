interface ValidationResult {
  valid: boolean;
  error?: string;
}

interface FormValidationResult {
  valid: boolean;
  errors: { field: string; message: string }[];
}

interface Question {
  id: string;
  type: 'text' | 'radio' | 'image';
  title: string;
  options?: string[];
  required: boolean;
}

export function validateCustomerName(name: string): ValidationResult {
  const trimmed = name.trim();
  if (!trimmed) {
    return { valid: false, error: '이름을 입력해주세요' };
  }
  return { valid: true };
}

export function validatePhoneNumber(phone: string): ValidationResult {
  const digits = phone.replace(/\D/g, '');
  if (!digits) {
    return { valid: false, error: '전화번호를 입력해주세요' };
  }
  if (digits.length < 10 || digits.length > 11) {
    return { valid: false, error: '올바른 전화번호를 입력해주세요' };
  }
  return { valid: true };
}

export function validateAnswer(question: Question, value: string): ValidationResult {
  if (!question.required) {
    return { valid: true };
  }
  if (!value.trim()) {
    return { valid: false, error: `${question.title}은(는) 필수입니다` };
  }
  return { valid: true };
}

export function validateReservationForm(form: {
  customerName: string;
  customerPhone: string;
  answers?: { questionId: string; value: string }[];
  questions?: Question[];
}): FormValidationResult {
  const errors: { field: string; message: string }[] = [];

  const nameResult = validateCustomerName(form.customerName);
  if (!nameResult.valid) {
    errors.push({ field: 'customerName', message: nameResult.error! });
  }

  const phoneResult = validatePhoneNumber(form.customerPhone);
  if (!phoneResult.valid) {
    errors.push({ field: 'customerPhone', message: phoneResult.error! });
  }

  if (form.questions && form.answers) {
    for (const question of form.questions) {
      const answer = form.answers.find((a) => a.questionId === question.id);
      const answerResult = validateAnswer(question, answer?.value || '');
      if (!answerResult.valid) {
        errors.push({ field: question.id, message: answerResult.error! });
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
