"use client";

import { MethodList } from "@/app/(app)/_components.tsx/method-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getSuggestedIngredientRefsForStep } from "@/lib/recipe-step-ingredients";
import { type RecipeEditFormData } from "@/lib/schemas/recipe";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { UseFormReturn, useFieldArray, useWatch } from "react-hook-form";
import { MethodStepImageUpload } from "./method-step-image-upload";
import { MethodStepIngredientsPicker } from "./method-step-ingredients-picker";
import { Recipe } from "./recipe-client";

interface MethodSectionProps {
  recipe: Recipe;
  isEditMode: boolean;
  form?: UseFormReturn<RecipeEditFormData>;
}

export function MethodSection({
  recipe,
  isEditMode,
  form,
}: MethodSectionProps) {
  const { fields, append, remove } = useFieldArray({
    control: form?.control,
    name: "method",
  });

  const ingredients = useWatch({ control: form?.control, name: "ingredients" });
  const methodSteps = useWatch({ control: form?.control, name: "method" });

  const availableIngredientOptions = useMemo(() => {
    const list = ingredients ?? [];
    const out: { id: string; label: string }[] = [];
    for (const ing of list) {
      const id = (ing as { id?: string }).id;
      if (!id?.trim()) continue;
      const label = ing.name;
      out.push({ id, label });
    }
    return out;
  }, [ingredients]);

  const ingredientIds = useMemo(() => {
    const list = ingredients ?? [];
    return list
      .map((i) => (i as { ingredientId?: string }).ingredientId)
      .filter((id): id is string => !!id) as Id<"ingredients">[];
  }, [ingredients]);
  const uniqueIngredientIds = useMemo(
    () => [...new Set(ingredientIds)],
    [ingredientIds],
  );
  const ingredientDocs = useQuery(
    api.ingredients.getByIds,
    uniqueIngredientIds.length > 0 ? { ids: uniqueIngredientIds } : "skip",
  );

  const recipeIngredientLines = useMemo(
    () =>
      (ingredients ?? []).map(
        (i: {
          id?: string;
          name: string;
          amount?: number;
          unit?: string;
          preparation?: string;
          ingredientId?: string;
        }) => ({
          id: i.id,
          name: i.name,
          amount: i.amount,
          unit: i.unit,
          preparation: i.preparation,
          ingredientId: i.ingredientId,
        }),
      ),
    [ingredients],
  );

  const handleRemoveStep = (index: number) => {
    remove(index);
  };

  if (isEditMode && form) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Method</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                title: "",
                description: "",
                image: undefined,
                ingredientRefs: [],
              })
            }
          >
            <Plus className="size-4 mr-2" />
            Add Step
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {fields.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground text-sm">
                No steps yet. Click &quot;Add Step&quot; to add one.
              </p>
            ) : (
              fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex gap-3 items-start p-4 border rounded-lg"
                >
                  <div className="h-8 w-8 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm mt-1">
                    {index + 1}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <Label
                        htmlFor={`method.${index}.title`}
                        className="text-xs"
                      >
                        Step Title
                      </Label>
                      <Input
                        id={`method.${index}.title`}
                        {...form.register(`method.${index}.title`)}
                        placeholder="e.g., Prepare the vegetables"
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor={`method.${index}.description`}
                        className="text-xs"
                      >
                        Description (optional)
                      </Label>
                      <Textarea
                        id={`method.${index}.description`}
                        {...form.register(`method.${index}.description`)}
                        placeholder="Add detailed instructions..."
                        className="min-h-[60px] resize-none"
                      />
                    </div>
                    {/* Image Upload Section */}
                    <MethodStepImageUpload
                      form={form}
                      stepIndex={index}
                      existingImageUrl={
                        recipe?.method?.[index]?.imageUrl || undefined
                      }
                    />
                    {/* Step ingredients: link recipe ingredients to this step */}
                    <MethodStepIngredientsPicker
                      stepIndex={index}
                      form={form}
                      availableOptions={availableIngredientOptions}
                      suggestedRefs={getSuggestedIngredientRefsForStep(
                        {
                          title: methodSteps?.[index]?.title ?? "",
                          description:
                            methodSteps?.[index]?.description ?? undefined,
                        },
                        recipeIngredientLines,
                        ingredientDocs ?? undefined,
                      )}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveStep(index)}
                    className="h-8 w-8 p-0 mt-5"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recipe?.method || recipe.method.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>method</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No method added yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Method</CardTitle>
      </CardHeader>
      <CardContent>
        <MethodList method={recipe.method} />
      </CardContent>
    </Card>
  );
}
