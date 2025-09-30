import React, { useState, useRef, useEffect } from "react";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useRouter } from "next/router";
import { searchCompanies, getCompaniesWithForms, deleteCompany, type CompanyWithForm } from "../../services/companies";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";

export function CompanyFormEntrance() {
  const router = useRouter();
  const toast = useRef<Toast>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [companies, setCompanies] = useState<CompanyWithForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAllCompanies, setShowAllCompanies] = useState(false);

  // Load recent companies on component mount
  useEffect(() => {
    loadRecentCompanies();
  }, []);

  const loadRecentCompanies = async () => {
    try {
      setLoading(true);
      const companiesData = await getCompaniesWithForms();
      setCompanies(companiesData.slice(0, 10)); // Show first 10 companies
    } catch (error: any) {
      console.error("Error loading companies:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to load companies",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadRecentCompanies();
      return;
    }

    try {
      setLoading(true);
      const searchResults = await searchCompanies(searchTerm);

      // Get forms for each company
      const companiesWithForms = await Promise.all(
        searchResults.map(async (company) => {
          try {
            const { getCompanyForm } = await import("../../services/companies");
            const form = await getCompanyForm(company.id);
            return { ...company, form: form || undefined };
          } catch (error) {
            return { ...company, form: undefined };
          }
        })
      );

      setCompanies(companiesWithForms);
      setShowAllCompanies(true);
    } catch (error: any) {
      console.error("Error searching companies:", error);
      toast.current?.show({
        severity: "error",
        summary: "Search Error",
        detail: "Failed to search companies",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    router.push("/form/new");
  };

  const handleEditForm = (company: CompanyWithForm) => {
    if (company.form) {
      router.push(`/form/edit/${company.name}`);
    } else {
      router.push(`/form/new?company=${encodeURIComponent(company.name)}`);
    }
  };

  const handleViewTree = (company: CompanyWithForm) => {
    if (company.form?.tree_url) {
      router.push(company.form.tree_url);
    } else if (company.form) {
      router.push(`/tree/${company.form.id}`);
    }
  };

  const handleDeleteCompany = (company: CompanyWithForm) => {
    confirmDialog({
      message: `Are you sure you want to delete "${company.name}"? This will permanently delete the company and all its form data.`,
      header: "Delete Company",
      icon: "fas fa-exclamation-triangle",
      acceptClassName: "p-button-danger",
      acceptLabel: "Delete",
      rejectLabel: "Cancel",
      accept: async () => {
        try {
          setLoading(true);
          await deleteCompany(company.id);

          // Remove company from current list
          setCompanies((prev) => prev.filter((c) => c.id !== company.id));

          toast.current?.show({
            severity: "success",
            summary: "Company Deleted",
            detail: `${company.name} has been deleted successfully.`,
            life: 3000,
          });
        } catch (error: any) {
          console.error("Error deleting company:", error);
          toast.current?.show({
            severity: "error",
            summary: "Delete Failed",
            detail: error.message || "Failed to delete company. Please try again.",
            life: 5000,
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const actionBodyTemplate = (company: CompanyWithForm) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="fas fa-edit"
          className="p-button-sm p-button-outlined"
          onClick={() => handleEditForm(company)}
          tooltip={company.form ? "Edit Form" : "Create Form"}
          tooltipOptions={{ position: "top" }}
        />
        {company.form && (
          <Button
            icon="fas fa-sitemap"
            className="p-button-sm p-button-outlined p-button-success"
            onClick={() => handleViewTree(company)}
            tooltip="View Tree"
            tooltipOptions={{ position: "top" }}
          />
        )}
        <Button
          icon="fas fa-trash"
          className="p-button-sm p-button-outlined p-button-danger"
          onClick={() => handleDeleteCompany(company)}
          tooltip="Delete Company"
          tooltipOptions={{ position: "top" }}
        />
      </div>
    );
  };

  const statusBodyTemplate = (company: CompanyWithForm) => {
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${company.form ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
      >
        {company.form ? "Form Created" : "No Form"}
      </span>
    );
  };

  const websiteBodyTemplate = (company: CompanyWithForm) => {
    if (!company.website) return <span className="text-gray-400">—</span>;

    return (
      <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
        <i className="fas fa-external-link-alt mr-1"></i>
        Visit
      </a>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 text-white rounded-xl mb-4">
            <i className="fas fa-building text-2xl"></i>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Company Form Manager</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Create new forms or manage existing company forms. Search for your company or create a new one to get started.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Create New Form Card */}
          <Card className="border-2 border-dashed border-purple-300 hover:border-purple-400 transition-colors">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-plus text-purple-600 text-xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Create New Form</h3>
              <p className="text-gray-600 mb-4">Start fresh with a new company form and build your evaluation blueprint.</p>
              <Button
                label="Create New Form"
                icon="fas fa-plus"
                className="p-button-lg"
                style={{ backgroundColor: "rgb(84, 22, 123)" }}
                onClick={handleCreateNew}
              />
            </div>
          </Card>

          {/* Search Existing Card */}
          <Card>
            <div className="p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-search text-blue-600 text-xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Find Existing Company</h3>
              <p className="text-gray-600 mb-4">Search for an existing company to edit its form or view the evaluation tree.</p>

              <div className="flex gap-2">
                <InputText
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Enter company name..."
                  className="flex-1"
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button icon="fas fa-search" onClick={handleSearch} loading={loading} disabled={loading} />
              </div>
            </div>
          </Card>
        </div>

        {/* Companies Table */}
        {companies.length > 0 && (
          <Card>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">{showAllCompanies ? "Search Results" : "Recent Companies"}</h3>
                {!showAllCompanies && (
                  <Button
                    label="View All Companies"
                    icon="fas fa-list"
                    className="p-button-text p-button-sm"
                    onClick={() => {
                      setShowAllCompanies(true);
                      loadRecentCompanies();
                    }}
                  />
                )}
              </div>

              <DataTable
                value={companies}
                loading={loading}
                emptyMessage="No companies found"
                paginator
                rows={10}
                className="p-datatable-sm"
                stripedRows
              >
                <Column
                  field="name"
                  header="Company Name"
                  sortable
                  style={{ minWidth: "200px" }}
                  body={(company) => <div className="font-medium text-gray-900">{company.name}</div>}
                />

                <Column field="website" header="Website" body={websiteBodyTemplate} style={{ width: "120px" }} />

                <Column header="Status" body={statusBodyTemplate} style={{ width: "120px" }} />

                <Column
                  field="updated_at"
                  header="Last Updated"
                  sortable
                  body={(company) => formatDate(company.updated_at)}
                  style={{ width: "140px" }}
                />

                <Column header="Actions" body={actionBodyTemplate} style={{ width: "150px" }} />
              </DataTable>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {companies.length === 0 && !loading && showAllCompanies && (
          <Card>
            <div className="text-center p-12">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-building text-gray-400 text-2xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm
                  ? `No companies match "${searchTerm}". Try a different search term or create a new form.`
                  : "No companies have been created yet. Start by creating your first form."}
              </p>
              <Button label="Create New Form" icon="fas fa-plus" style={{ backgroundColor: "rgb(84, 22, 123)" }} onClick={handleCreateNew} />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
