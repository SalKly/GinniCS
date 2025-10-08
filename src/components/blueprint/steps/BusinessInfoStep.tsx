import React, { useState, useRef } from "react";
import { Control, UseFormSetValue, useWatch } from "react-hook-form";
import { Button } from "primereact/button";
import { InputTextField } from "../../form/InputTextField";
import { TextAreaField } from "../../form/TextAreaField";
import { StepProps, BlueprintData } from "../../../models/blueprint";
import { parsePdfToText, isPdfFile, formatExtractedText } from "../../../utils/pdfParser";

interface BusinessInfoStepProps extends StepProps {
  control: Control<any>;
  setValue: UseFormSetValue<any>;
}

export function BusinessInfoStep({ formState, onUpdateFormState, onNext, onPrevious, onComplete, control, setValue }: BusinessInfoStepProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isParsingPdf, setIsParsingPdf] = useState<boolean>(false);
  const [pdfParseError, setPdfParseError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Watch the business info fields
  const businessInfo = useWatch({
    control,
    name: "businessInfo",
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      setUploadedFile(file);
      setFileName(file.name);
      setPdfParseError("");

      // Update the form data with file info first
      onUpdateFormState({
        blueprintData: {
          ...formState.blueprintData,
          businessInfo: {
            ...businessInfo,
            qaManualFile: file,
            qaManualFileName: file.name,
          },
        },
      });

      // If it's a PDF, parse it for text content
      if (isPdfFile(file)) {
        setIsParsingPdf(true);

        try {
          const extractedText = await parsePdfToText(file);
          const formattedText = formatExtractedText(extractedText);

          // Update react-hook-form value directly (this will trigger the UI update)
          setValue("businessInfo.documentTranscription", formattedText, { shouldValidate: true });

          // Update the form data with transcription
          onUpdateFormState({
            blueprintData: {
              ...formState.blueprintData,
              businessInfo: {
                ...businessInfo,
                qaManualFile: file,
                qaManualFileName: file.name,
                documentTranscription: formattedText,
              },
            },
          });
        } catch (error) {
          console.error("PDF parsing error:", error);
          setPdfParseError(error instanceof Error ? error.message : "Failed to parse PDF document");
        } finally {
          setIsParsingPdf(false);
        }
      }
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setFileName("");
    setPdfParseError("");

    // Update the form data
    onUpdateFormState({
      blueprintData: {
        ...formState.blueprintData,
        businessInfo: {
          ...businessInfo,
          qaManualFile: null,
          qaManualFileName: "",
          documentTranscription: "",
        },
      },
    });

    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-10 h-10 bg-purple-700 text-white rounded-lg mb-3">
          <i className="fas fa-building text-sm"></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Information</h2>
        <p className="text-gray-600">Tell us about your business and upload your QA manual to get started with creating your onboarding blueprint.</p>
      </div>

      <div className="info-box">
        <div className="flex items-start gap-3">
          <div className="text-purple-700 mt-0.5">
            <i className="fas fa-info-circle"></i>
          </div>
          <div>
            <h4 className="font-semibold text-purple-900 mb-2">Why do we need this information?</h4>
            <p className="text-purple-800">
              Your business name and goals help us personalize the blueprint generation process. The QA manual provides context about your current
              quality standards and processes, which helps us create more relevant evaluation criteria for your sales calls.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Business Name */}
        <div className="blueprint-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputTextField
              control={control}
              field="businessInfo.businessName"
              label="Business Name"
              placeholder="Enter your company name"
              isRequired
              toolTip="The name of your business or organization"
            />
            <InputTextField
              control={control}
              field="businessInfo.companyWebsite"
              label="Company Website"
              placeholder="https://www.yourcompany.com"
              toolTip="Your company's website URL (optional)"
            />
          </div>
        </div>

        {/* Business Goals */}
        <div className="blueprint-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Goals</h3>
          <TextAreaField
            control={control}
            field="businessInfo.businessGoals"
            label="What are your main business goals?"
            placeholder="Describe your primary business objectives, target metrics, and what success looks like for your sales team..."
            rows={4}
            isRequired
            toolTip="This helps us understand your business context and create relevant evaluation criteria"
          />
        </div>

        {/* QA Manual Upload */}
        <div className="blueprint-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Assurance Manual</h3>
          <p className="text-gray-600 mb-4">
            Upload your existing QA manual or quality standards document to help us understand your current processes and create a more relevant
            blueprint.
          </p>

          <div className="space-y-4">
            {/* File Upload Area */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors cursor-pointer"
              onClick={triggerFileUpload}
            >
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                  <i className="fas fa-cloud-upload-alt text-purple-700 text-xl"></i>
                </div>
                <p className="text-gray-600 mb-2">{fileName ? `Selected: ${fileName}` : "Click to upload QA manual"}</p>
                <p className="text-sm text-gray-500">PDF ONLY (Max 10MB)</p>
              </div>
            </div>

            {/* Hidden file input */}
            <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />

            {/* File Actions */}
            {uploadedFile && (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <i className="fas fa-file-alt text-green-600"></i>
                  <div>
                    <p className="font-medium text-green-900">{fileName}</p>
                    <p className="text-sm text-green-700">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <Button type="button" className="p-button-danger p-button-outlined p-button-sm" onClick={removeFile} tooltip="Remove file">
                  <i className="fas fa-trash"></i>
                </Button>
              </div>
            )}

            {/* PDF Parsing Status */}
            {isParsingPdf && (
              <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-700"></div>
                <p className="text-purple-800 font-medium">Parsing PDF document...</p>
              </div>
            )}

            {/* PDF Parse Error */}
            {pdfParseError && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
                <i className="fas fa-exclamation-triangle text-red-600"></i>
                <p className="text-red-800 font-medium">{pdfParseError}</p>
              </div>
            )}

            {/* Document Transcription Field */}
            {businessInfo?.documentTranscription && (
              <div className="space-y-2">
                <TextAreaField
                  control={control}
                  field="businessInfo.documentTranscription"
                  label="Document Transcription"
                  placeholder="Extracted text from your uploaded document will appear here..."
                  rows={8}
                  toolTip="This is the extracted text content from your uploaded PDF document. You can edit this text if needed."
                />
                <p className="text-sm text-gray-500">
                  <i className="fas fa-magic mr-1"></i>
                  Text automatically extracted from your PDF document. This will be used for AI analysis.
                </p>
              </div>
            )}

            {/* Optional indicator */}
            <p className="text-sm text-gray-500">
              <i className="fas fa-info-circle mr-1"></i>
              QA manual upload is optional but recommended for better blueprint customization
            </p>
          </div>
        </div>
      </div>

      <div className="warning-box">
        <div className="flex items-start gap-4">
          <div className="text-warning-600 mt-1">
            <i className="fas fa-lightbulb"></i>
          </div>
          <div>
            <h4 className="font-semibold text-warning-900 mb-2">Next Steps</h4>
            <p className="text-warning-800">
              After providing your business information, you'll define the call outcomes and evaluation criteria for your sales team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
