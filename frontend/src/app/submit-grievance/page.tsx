import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Step1Category from './Step1Category';
import Step2Description from './Step2Description';
import Step3Review from './Step3Review';
import SuccessScreen from './SuccessScreen';
import { api } from '@/lib/api';
import { useGrievanceSubmit } from '@/hooks/useGrievanceSubmit';
import { GrievanceFormData } from './page';

const grievanceSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  departmentId: z.string().min(1, 'Department is required'),
  description: z.string().min(50, 'Minimum 50 characters').max(2000, 'Maximum 2000 characters'),
  isAnonymous: z.boolean().default(false),
  attachments: z.array(z.object({
    name: z.string(),
    size: z.number(),
    type: z.string(),
  })).max(5),
  // priorityFlag is not directly in the form, but might be determined by category logic
  priorityFlag: z.string().optional(),
});

export default function SubmitGrievancePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [grievanceId, setGrievanceId] = useState('');
  const [slaDeadline, setSlaDeadline] = useState('');

  const methods = useForm<GrievanceFormData>({
    resolver: zodResolver(grievanceSchema),
    defaultValues: {
      isAnonymous: false,
      attachments: [],
    },
    mode: 'onChange',
  });

  const { submitGrievance, loading, error } = useGrievanceSubmit();

  useEffect(() => {
    const savedDraft = localStorage.getItem('grievance-draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        // Ensure attachments are in the correct format if they were saved
        if (parsed.attachments && Array.isArray(parsed.attachments)) {
          parsed.attachments = parsed.attachments.map((att: any) => ({
            name: att.name || 'unknown_file.dat',
            size: att.size || 0,
            type: att.type || 'application/octet-stream',
          }));
        } else {
          parsed.attachments = [];
        }
        methods.reset(parsed);
        setShowDraftBanner(true);
      } catch (e) {
        localStorage.removeItem('grievance-draft');
        console.error("Failed to parse draft:", e);
      }
    }
  }, [methods]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (step < 4 && !submitted) {
      const subscription = methods.watch((data) => {
        localStorage.setItem('grievance-draft', JSON.stringify(data));
      });

      interval = setInterval(() => {
        const currentData = methods.getValues();
        localStorage.setItem('grievance-draft', JSON.stringify(currentData));
      }, 60000);

      return () => {
        subscription.unsubscribe();
        if (interval) clearInterval(interval);
      };
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [methods, step, submitted]);

  const handleRestoreDraft = () => {
    setShowDraftBanner(false);
    setStep(1); // Assuming draft always starts from step 1
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem('grievance-draft');
    methods.reset({
      isAnonymous: false,
      attachments: [],
    });
    setShowDraftBanner(false);
  };

  const handleSubmitSuccess = (id: string, deadline: string) => {
    localStorage.removeItem('grievance-draft');
    setGrievanceId(id);
    setSlaDeadline(deadline);
    setSubmitted(true);
  };

  const handleError = (message: string) => {
      setError(message);
  };

  if (submitted) {
    return <SuccessScreen grievanceId={grievanceId} slaDeadline={slaDeadline} />;
  }

  return (
    <div className="min-h-screen bg-paper-texture">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Draft Banner */}
        {showDraftBanner && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between animate-fade-in">
            <p className="text-amber-800 font-medium">
              You have a saved draft. Continue?
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleRestoreDraft}
                className="px-4 py-1.5 bg-amber-600 text-white rounded hover:bg-amber-700 transition"
              >
                Yes
              </button>
              <button
                onClick={handleDiscardDraft}
                className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
             <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between animate-fade-in">
                <p className="text-red-800 font-medium">{error}</p>
                <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">&times;</button>
            </div>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">
            Submit a Grievance
          </h1>
          <p className="text-gray-600">
            Your concerns matter. We'll respond within the SLA timeframe.
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center mb-12">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                s === step
                  ? 'bg-amber-600 text-white'
                  : s < step
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {s < step ? '✓' : s}
              </div>
              {s < 3 && (
                <div className={`w-16 h-0.5 mx-2 ${
                  s < step ? 'bg-gray-800' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <FormProvider {...methods}>
            {step === 1 && <Step1Category onNext={() => setStep(2)} />}
            {step === 2 && (
              <Step2Description
                onNext={() => setStep(3)}
                onBack={() => setStep(1)}
              />
            )}
            {step === 3 && (
              <Step3Review
                onBack={() => setStep(2)}
                onSubmitSuccess={handleSubmitSuccess}
                onError={handleError}
              />
            )}
          </FormProvider>
        </div>
      </div>
    </div>
  );
}