import { PackManifest, QuestionPackItem, ExamTemplatePackItem, TipPackItem, PackValidationResult } from '../../shared/types/contentPack';
import { MANIFEST_SCHEMA, QUESTION_SCHEMA, EXAM_TEMPLATE_SCHEMA, TIP_SCHEMA } from './schemas';

// Simple JSON Schema validator (for production, consider using a library like ajv)
class SimpleValidator {
  validate(schema: any, data: any, path: string = ''): Array<{ field: string; message: string }> {
    const errors: Array<{ field: string; message: string }> = [];
    
    if (schema.type === 'object') {
      if (typeof data !== 'object' || data === null) {
        errors.push({ field: path, message: `Expected object, got ${typeof data}` });
        return errors;
      }
      
      // Check required fields
      if (schema.required) {
        for (const required of schema.required) {
          if (!(required in data)) {
            errors.push({ field: `${path}.${required}`, message: `Missing required field` });
          }
        }
      }
      
      // Validate properties
      if (schema.properties) {
        for (const [key, value] of Object.entries(data)) {
          if (schema.properties[key]) {
            errors.push(...this.validate(schema.properties[key], value, `${path}.${key}`));
          }
        }
      }
    } else if (schema.type === 'array') {
      if (!Array.isArray(data)) {
        errors.push({ field: path, message: `Expected array, got ${typeof data}` });
        return errors;
      }
      
      if (schema.minItems && data.length < schema.minItems) {
        errors.push({ field: path, message: `Array must have at least ${schema.minItems} items` });
      }
      
      if (schema.items) {
        data.forEach((item, index) => {
          errors.push(...this.validate(schema.items, item, `${path}[${index}]`));
        });
      }
    } else if (schema.type === 'string') {
      if (typeof data !== 'string') {
        errors.push({ field: path, message: `Expected string, got ${typeof data}` });
        return errors;
      }
      
      if (schema.minLength && data.length < schema.minLength) {
        errors.push({ field: path, message: `String must be at least ${schema.minLength} characters` });
      }
      
      if (schema.maxLength && data.length > schema.maxLength) {
        errors.push({ field: path, message: `String must be at most ${schema.maxLength} characters` });
      }
      
      if (schema.pattern && !new RegExp(schema.pattern).test(data)) {
        errors.push({ field: path, message: `String does not match required pattern` });
      }
      
      if (schema.enum && !schema.enum.includes(data)) {
        errors.push({ field: path, message: `Value must be one of: ${schema.enum.join(', ')}` });
      }
    } else if (schema.type === 'number') {
      if (typeof data !== 'number') {
        errors.push({ field: path, message: `Expected number, got ${typeof data}` });
        return errors;
      }
      
      if (schema.minimum !== undefined && data < schema.minimum) {
        errors.push({ field: path, message: `Number must be at least ${schema.minimum}` });
      }
      
      if (schema.maximum !== undefined && data > schema.maximum) {
        errors.push({ field: path, message: `Number must be at most ${schema.maximum}` });
      }
    }
    
    return errors;
  }
}

export class PackValidator {
  private validator = new SimpleValidator();

  validateManifest(manifest: PackManifest): PackValidationResult {
    const errors: PackValidationResult['errors'] = [];
    const warnings: PackValidationResult['warnings'] = [];

    // Schema validation
    const schemaErrors = this.validator.validate(MANIFEST_SCHEMA, manifest);
    errors.push(...schemaErrors.map(error => ({
      file: 'manifest.json',
      field: error.field,
      message: error.message
    })));

    // Business logic validation
    if (manifest.metadata) {
      // Check if metadata counts make sense
      if (manifest.metadata.totalQuestions <= 0) {
        warnings.push({
          file: 'manifest.json',
          field: 'metadata.totalQuestions',
          message: 'Pack should contain at least one question'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  validateQuestions(questions: QuestionPackItem[]): PackValidationResult {
    const errors: PackValidationResult['errors'] = [];
    const warnings: PackValidationResult['warnings'] = [];
    const questionIds = new Set<string>();

    questions.forEach((question, index) => {
      // Schema validation
      const schemaErrors = this.validator.validate(QUESTION_SCHEMA, question);
      errors.push(...schemaErrors.map(error => ({
        file: 'questions.jsonl',
        line: index + 1,
        field: error.field,
        message: error.message
      })));

      // Business logic validation
      if (questionIds.has(question.id)) {
        errors.push({
          file: 'questions.jsonl',
          line: index + 1,
          field: 'id',
          message: `Duplicate question ID: ${question.id}`
        });
      }
      questionIds.add(question.id);

      // Question type specific validation
      if (question.type === 'single' || question.type === 'multi') {
        if (!question.choices || question.choices.length < 2) {
          errors.push({
            file: 'questions.jsonl',
            line: index + 1,
            field: 'choices',
            message: 'MCQ questions must have at least 2 choices'
          });
        }

        if (!question.correct || question.correct.length === 0) {
          errors.push({
            file: 'questions.jsonl',
            line: index + 1,
            field: 'correct',
            message: 'MCQ questions must have correct answers specified'
          });
        }

        if (question.type === 'single' && question.correct && question.correct.length > 1) {
          warnings.push({
            file: 'questions.jsonl',
            line: index + 1,
            field: 'correct',
            message: 'Single choice questions should have only one correct answer'
          });
        }
      }

      if (question.type === 'order') {
        if (!question.correctOrder || question.correctOrder.length < 2) {
          errors.push({
            file: 'questions.jsonl',
            line: index + 1,
            field: 'correctOrder',
            message: 'Ordering questions must have at least 2 items in correct order'
          });
        }
      }

      // Check for broken exhibit references
      if (question.exhibits) {
        question.exhibits.forEach(exhibit => {
          if (!exhibit.match(/\.(png|jpg|jpeg|gif|svg)$/i)) {
            warnings.push({
              file: 'questions.jsonl',
              line: index + 1,
              field: 'exhibits',
              message: `Exhibit file should be an image: ${exhibit}`
            });
          }
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  validateExamTemplates(templates: ExamTemplatePackItem[]): PackValidationResult {
    const errors: PackValidationResult['errors'] = [];
    const warnings: PackValidationResult['warnings'] = [];
    const templateIds = new Set<string>();

    templates.forEach((template, index) => {
      // Schema validation
      const schemaErrors = this.validator.validate(EXAM_TEMPLATE_SCHEMA, template);
      errors.push(...schemaErrors.map(error => ({
        file: 'examTemplates.json',
        line: index + 1,
        field: error.field,
        message: error.message
      })));

      // Business logic validation
      if (templateIds.has(template.id)) {
        errors.push({
          file: 'examTemplates.json',
          line: index + 1,
          field: 'id',
          message: `Duplicate template ID: ${template.id}`
        });
      }
      templateIds.add(template.id);

      // Validate difficulty mix
      template.sections.forEach((section, sectionIndex) => {
        if (section.difficultyMix) {
          const total = (section.difficultyMix.easy || 0) + 
                       (section.difficultyMix.med || 0) + 
                       (section.difficultyMix.hard || 0);
          
          if (Math.abs(total - 1.0) > 0.001) {
            warnings.push({
              file: 'examTemplates.json',
              line: index + 1,
              field: `sections[${sectionIndex}].difficultyMix`,
              message: 'Difficulty mix should sum to 1.0'
            });
          }
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  validateTips(tips: TipPackItem[]): PackValidationResult {
    const errors: PackValidationResult['errors'] = [];
    const warnings: PackValidationResult['warnings'] = [];
    const tipIds = new Set<string>();

    tips.forEach((tip, index) => {
      // Schema validation
      const schemaErrors = this.validator.validate(TIP_SCHEMA, tip);
      errors.push(...schemaErrors.map(error => ({
        file: 'tips.json',
        line: index + 1,
        field: error.field,
        message: error.message
      })));

      // Business logic validation
      if (tipIds.has(tip.id)) {
        errors.push({
          file: 'tips.json',
          line: index + 1,
          field: 'id',
          message: `Duplicate tip ID: ${tip.id}`
        });
      }
      tipIds.add(tip.id);
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  validateEntirePack(
    manifest: PackManifest,
    questions: QuestionPackItem[],
    templates: ExamTemplatePackItem[],
    tips: TipPackItem[]
  ): PackValidationResult {
    const manifestResult = this.validateManifest(manifest);
    const questionsResult = this.validateQuestions(questions);
    const templatesResult = this.validateExamTemplates(templates);
    const tipsResult = this.validateTips(tips);

    // Cross-reference validation
    const crossRefErrors: PackValidationResult['errors'] = [];
    const crossRefWarnings: PackValidationResult['warnings'] = [];

    // Check if metadata matches actual counts
    if (manifest.metadata) {
      if (manifest.metadata.totalQuestions !== questions.length) {
        crossRefWarnings.push({
          file: 'manifest.json',
          field: 'metadata.totalQuestions',
          message: `Metadata count (${manifest.metadata.totalQuestions}) doesn't match actual questions (${questions.length})`
        });
      }
    }

    return {
      isValid: manifestResult.isValid && questionsResult.isValid && 
               templatesResult.isValid && tipsResult.isValid && 
               crossRefErrors.length === 0,
      errors: [
        ...manifestResult.errors,
        ...questionsResult.errors,
        ...templatesResult.errors,
        ...tipsResult.errors,
        ...crossRefErrors
      ],
      warnings: [
        ...manifestResult.warnings,
        ...questionsResult.warnings,
        ...templatesResult.warnings,
        ...tipsResult.warnings,
        ...crossRefWarnings
      ]
    };
  }
}
