'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { GrievanceFormData } from './page';
import { useCategories } from '@/hooks/useCategories';
import { useDepartments } from '@/hooks/useDepartments';
import { useGrievanceSubmit } from '@/hooks/useGrievanceSubmit';

interface Step3Props {
  onBack: () => void;
  onSubmitSuccess: (grievanceId: string, deadline: string) => void;
  onError?: (msg: string) => void;
}

export default function Step3Review({ onBack, onSubmitSuccess, onError }: Step3Props) {
  const { watch } = useFormContext<GrievanceFormData>();
  const { categories } = useCategories();
  const { departments } = useDepartments();
  const { submitGrievance, loading } = useGrievanceSubmit();

  const formData = watch();
  const [declaration, setDeclaration] = useState(false);

  const category = categories?.find((c) => c.id === formData.categoryId);
  const department = departments?.find((d) => d.id === formData.departmentId);

  const handleSubmit = async () => {
    if (!declaration) return;

    const result = await submitGrievance(formData);
    if (result) {
      onSubmitSuccess(result.grievanceId, result.slaDeadline);
    } else {
      onError?.('Submission failed. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-serif font-semibold text-gray-800">
        Step 3: Review & Submit
      </h2>

      {/* Summary Panel */}
      <div className="space-y-4">
        {/* Category & Department */}
        <div className="pb-4 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Category</p>
              <p className="font-medium text-gray-800">{category?.name || 'Not selected'}</p>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="text-amber-600 text-sm font-medium hover:underline"
            >
              Edit
            </button>
          </div>
        </div>

        <div className="pb-4 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Department</p>
              <p className="font-medium text-gray-800">{department?.name || 'Not selected'}</p>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="text-amber-600 text-sm font-medium hover:underline"
            >
              Edit
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="pb-4 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Description</p>
              <p className="text-gray-700 text-sm line-clamp-4">{formData.description}</p>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="text-amber-600 text-sm font-medium hover:underline"
            >
              Edit
            </button>
          </div>
        </div>

        {/* Anonymous */}
        <div className="pb-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Anonymous Filing</p>
              <p className="font-medium text-gray-800">
                {formData.isAnonymous ? 'Yes' : 'No'}
              </p>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="text-amber-600 text-sm font-medium hover:underline"
            >
              Edit
            </button>
          </div>
        </div>

        {/* Attachments */}
        {formData.attachments && formData.attachments.length > 0 && (
          <div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Attachments</p>
                <ul className="text-sm text-gray-700">
                  {formData.attachments.map((a) => (
                    <li key={a.name} className="truncate">• {a.name}</li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={onBack}
                className="text-amber-600 text-sm font-medium hover:underline"
              >
                Edit
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Declaration */}
      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
        <input
          type="checkbox"
          id="declaration"
          checked={/* isolated state to be managed by this component */ false}
          readOnly
          className="mt-1 w-4 h-4 text-amber-600 border-gray-300 rounded"
        />
        <label htmlFor="declaration" className="text-sm text-gray-700 cursor-pointer">
          I confirm that the information provided is accurate to the best of my knowledge.
          I understand that providing false information may result in the rejection of my grievance.
        </label>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="flex-1 py-2.5 px-4 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition ${
            loading
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-amber-600 text-white hover:bg-amber-700'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Submitting...
            </span>
          ) : (
            'Submit Grievance'
          )}
        </button>
      </div>
    </div>
  );
}