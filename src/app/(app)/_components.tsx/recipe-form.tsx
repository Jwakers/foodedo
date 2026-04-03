"use client";

import { ROUTES } from "@/app/constants";
import { PreparationSelector } from "@/components/preparation-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UnitSelector } from "@/components/unit-selector";
import { useImageUpload } from "@/lib/hooks/use-image-upload";
import {
  recipeCreateSchema,
  type RecipeCreateFormData,
} from "@/lib/schemas/recipe";
import { cn, formatLabel, titleCase } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import {
  COMPLEXITY_TIERS,
  CUISINES,
  CUISINE_MAX_SELECTIONS,
  PRIMARY_PROTEINS,
  RECIPE_CATEGORIES,
} from "convex/lib/constants";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, Plus, X } from "lucide-react";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/posthog-client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { FieldErrors, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { RecipeImageField } from "./recipe-image-field";

type RecipeFormProps = {
  /** When provided (e.g. in drawer), called on close/error. When omitted (standalone page), router is used. */
  closeDrawer?: () => void;
};

type FormStep = "basic" | "ingredients" | "method" | "review";

export function RecipeForm({ closeDrawer }: RecipeFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<FormStep>("basic");
  const [slideDirection, setSlideDirection] = useState<"next" | "prev">("next");
  const [recipeId, setRecipeId] = useState<Id<"recipes"> | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const creatingRecipe = useRef(false);
  const isSavedRef = useRef(false);

  const createEmptyRecipeMutation = useMutation(api.recipes.createEmptyRecipe);
  const updateRecipeMutation = useMutation(api.recipes.updateRecipe);
  const generateUploadUrl = useMutation(api.recipes.generateUploadUrl);
  const updateRecipeImageAndDeleteOld = useMutation(
    api.recipes.updateRecipeImageAndDeleteOld,
  );

  // Image upload hook (for preview only - upload happens on submit)
  const imageUpload = useImageUpload();
  const deleteRecipeMutation = useMutation(api.recipes.deleteRecipe);

  const form = useForm<RecipeCreateFormData>({
    resolver: zodResolver(recipeCreateSchema),
    defaultValues: {
      category: "main",
      title: "",
      description: "",
      prepTime: undefined,
      cookTime: undefined,
      serves: undefined,
      image: undefined,
      ingredients: [],
      method: [],
      primaryProtein: undefined,
      complexityTier: undefined,
      cuisine: [],
    },
  });

  const {
    fields: ingredientFields,
    append: appendIngredient,
    remove: removeIngredient,
  } = useFieldArray({
    control: form.control,
    name: "ingredients",
  });

  const {
    fields: methodFields,
    append: appendMethodStep,
    remove: removeMethodStep,
  } = useFieldArray({
    control: form.control,
    name: "method",
  });

  const steps: { key: FormStep; title: string; description: string }[] = [
    { key: "basic", title: "Basic Info", description: "Recipe details" },
    {
      key: "ingredients",
      title: "Ingredients",
      description: "Add ingredients",
    },
    { key: "method", title: "Method", description: "Cooking steps" },
    { key: "review", title: "Review", description: "Check and save" },
  ];

  const currentStepIndex = steps.findIndex((step) => step.key === currentStep);

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setSlideDirection("next");
      setCurrentStep(steps[nextIndex].key);
    }
  };

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setSlideDirection("prev");
      setCurrentStep(steps[prevIndex].key);
    }
  };

  const addIngredient = () => {
    appendIngredient({
      name: "",
      amount: undefined,
      unit: undefined,
      preparation: undefined,
    });
  };

  const addMethodStep = () => {
    appendMethodStep({
      title: "",
      description: "",
      image: undefined,
    });
  };

  const getMethodData = useCallback(async (values: RecipeCreateFormData) => {
    // Method step images are handled separately in method-section component
    // This just returns the method steps as-is (images should already be storage IDs)
    return values.method.map((step) => ({
      ...step,
      image: step.image instanceof File ? undefined : step.image,
    }));
  }, []);

  const hasFormData = useCallback((values: RecipeCreateFormData) => {
    return (
      (values.title?.trim() ?? "") !== "" ||
      (values.description?.trim() ?? "") !== "" ||
      values.ingredients.length > 0 ||
      values.method.length > 0
    );
  }, []);

  const saveDraft = useCallback(async () => {
    if (!recipeId || isSavedRef.current) return;
    const values = form.getValues();
    if (!hasFormData(values)) return;
    try {
      const methodData = await getMethodData(values);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- image excluded from draft save
      const { image, ...valuesToUpdate } = values;
      await updateRecipeMutation({
        recipeId,
        ...valuesToUpdate,
        method: methodData,
      });
    } catch (error) {
      console.error("Failed to save draft on navigation:", error);
    }
  }, [form, getMethodData, hasFormData, recipeId, updateRecipeMutation]);

  const onSubmit = async (values: RecipeCreateFormData) => {
    // Only allow submission when on the review step and not already saved
    if (currentStep !== "review" || isSaved) {
      return;
    }

    // Mark as saved to prevent multiple saves
    setIsSaved(true);
    isSavedRef.current = true;

    try {
      if (!recipeId) throw new Error("Recipe ID not found");

      const method = await getMethodData(values);
      const { image: _image, ...payload } = values;

      // Update recipe data
      await updateRecipeMutation({
        recipeId,
        ...payload,
        method,
      });

      // Handle image upload only if there's a new image
      const image = values.image;
      if (image instanceof File) {
        try {
          const postUrl = await generateUploadUrl();
          const ac = new AbortController();
          const t = setTimeout(() => ac.abort(), 30_000);
          const result = await fetch(postUrl, {
            method: "POST",
            headers: { "Content-Type": image.type },
            body: image,
            signal: ac.signal,
          }).finally(() => clearTimeout(t));

          if (!result.ok) {
            throw new Error("Failed to upload image");
          }

          const { storageId } = await result.json();
          await updateRecipeImageAndDeleteOld({ recipeId, storageId });
          toast.success("Image uploaded successfully");
        } catch (error) {
          const message =
            error instanceof ConvexError
              ? error.message
              : "Unexpected error. Unable to upload image";

          toast.error(message, {
            description: "Please try again",
          });
        }
      }

      trackEvent(ANALYTICS_EVENTS.RECIPE_CREATED, {
        recipe_category: values.category,
        has_image: values.image instanceof File,
      });

      if (closeDrawer) closeDrawer();
      toast.success("Recipe saved successfully");
      // Redirect to recipe page
      router.push(`${ROUTES.RECIPE}/${recipeId}`);
    } catch (error) {
      console.error(error);
      // Reset save flags so cleanup can remove the incomplete recipe
      setIsSaved(false);
      isSavedRef.current = false;
      toast.error("Unexpected error. Unable to save recipe", {
        description: "Please try again",
      });
    }
  };

  const onError = (errors: FieldErrors<RecipeCreateFormData>) => {
    const errorList = (
      <ul className="list-disc">
        {Object.values(errors).map((error) => (
          <li key={error.message}>{error.message}</li>
        ))}
      </ul>
    );
    toast.error("Please fix the errors in the form", {
      description: errorList,
    });
  };

  // Create an empty recipe on mount
  useEffect(() => {
    if (recipeId || creatingRecipe.current) return;
    creatingRecipe.current = true;
    // Create an empty recipe and then update as we go
    createEmptyRecipeMutation()
      .then(({ recipeId, error }) => {
        if (error) {
          toast.error(error);
          if (closeDrawer) closeDrawer();
          else router.push(ROUTES.MY_RECIPES);
          return;
        }
        setRecipeId(recipeId);
      })
      .catch((error) => {
        console.error(error);
        toast.error("Unexpected error. Unable to create recipe", {
          description: "Please try again",
        });
        if (closeDrawer) closeDrawer();
        else router.push(ROUTES.MY_RECIPES);
      })
      .finally(() => {
        creatingRecipe.current = false;
      });
  }, [closeDrawer, createEmptyRecipeMutation, recipeId, router]);

  useEffect(() => {
    // Update the recipe at each step (but not on review step - user should manually save)
    if (!recipeId) return;
    if (!form.formState.isDirty) return;
    if (currentStep === "review") return; // Don't auto-update on review step
    if (isSaved) return; // Don't update if already saved

    const updateRecipe = async () => {
      const formValues = form.getValues();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- image excluded from step auto-update
      const { image, ...valuesToUpdate } = formValues;
      const methodData = await getMethodData(formValues);

      updateRecipeMutation({
        recipeId,
        ...valuesToUpdate,
        method: methodData,
      }).catch((error) => {
        console.error(error);
      });
    };
    updateRecipe();
  }, [
    currentStep,
    form,
    getMethodData,
    recipeId,
    updateRecipeMutation,
    isSaved,
  ]);

  // On unmount: save draft if form has data (so user can return), else delete empty recipe.
  // Note: saveDraft() is async and cleanup does not await it—React does not wait for async
  // cleanup. On rapid SPA navigation the request may be cancelled before it completes.
  // beforeunload (below) covers browser close/refresh; in-app nav may occasionally lose
  // the draft. For guaranteed persistence on unmount we’d need e.g. navigator.sendBeacon
  // to a dedicated API route that calls Convex server-side.
  useEffect(() => {
    return () => {
      if (!recipeId || isSavedRef.current) return;
      const values = form.getValues();
      if (hasFormData(values)) {
        void saveDraft();
      } else {
        deleteRecipeMutation({ recipeId }).catch((error) => {
          console.error("Failed to delete unsaved recipe:", error);
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeId]);

  // Warn on browser close/refresh when form has unsaved data
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSavedRef.current) return;
      const values = form.getValues();
      if (hasFormData(values)) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [form, hasFormData]);

  const renderStepContent = () => {
    switch (currentStep) {
      case "basic":
        return (
          <Card>
            <CardContent>
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipe Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter recipe title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Describe your recipe"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div
                  className="grid grid-cols-2 gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <FormField
                    control={form.control}
                    name="prepTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prep Time (min) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="15"
                            {...field}
                            onChange={(e) => {
                              const { value } = e.target;
                              field.onChange(
                                value === "" ? undefined : Number(value),
                              );
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cookTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cook Time (min)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="30"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(
                                value === "" ? undefined : Number(value),
                              );
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <FormField
                    control={form.control}
                    name="serves"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Serves *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="4"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(
                                value === "" ? undefined : Number(value),
                              );
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                >
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Select
                            {...field}
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                              {RECIPE_CATEGORIES.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {titleCase(category)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                >
                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                      <RecipeImageField field={field} upload={imageUpload} />
                    )}
                  />
                </motion.div>

                {/* Meal planning (optional, for weekly generator) */}
                <motion.div
                  className="space-y-4 border-t pt-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.55 }}
                >
                  <p className="text-sm font-medium text-muted-foreground">
                    Meal planning (optional)
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="primaryProtein"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary protein</FormLabel>
                          <Select
                            value={field.value ?? ""}
                            onValueChange={(v) =>
                              field.onChange(v || undefined)
                            }
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select protein" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PRIMARY_PROTEINS.map((p) => (
                                <SelectItem key={p} value={p}>
                                  {formatLabel(p)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="complexityTier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Complexity</FormLabel>
                          <Select
                            value={field.value ?? ""}
                            onValueChange={(v) =>
                              field.onChange(v === "__none" || !v ? null : v)
                            }
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select complexity" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="__none">
                                Not specified
                              </SelectItem>
                              {COMPLEXITY_TIERS.map((t) => (
                                <SelectItem key={t} value={t}>
                                  {formatLabel(t)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="cuisine"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Cuisine (max {CUISINE_MAX_SELECTIONS}, e.g. fusion)
                        </FormLabel>
                        <div className="flex flex-wrap gap-2">
                          {Array.from(
                            { length: CUISINE_MAX_SELECTIONS },
                            (_, i) => i,
                          ).map((i) => {
                            const selected = field.value ?? [];
                            const optionsForIndex = [
                              "__none",
                              ...CUISINES.filter(
                                (c) =>
                                  selected[i] === c || !selected.includes(c),
                              ),
                            ];
                            return (
                              <Select
                                key={i}
                                value={
                                  field.value?.[i] ? field.value[i] : "__none"
                                }
                                onValueChange={(v) => {
                                  const raw = v === "__none" ? undefined : v;
                                  const next = [...(field.value ?? [])].filter(
                                    Boolean,
                                  );
                                  if (raw) {
                                    const cuisineVal =
                                      raw as (typeof CUISINES)[number];
                                    const deduped = next.filter(
                                      (x, idx) => idx === i || x !== cuisineVal,
                                    );
                                    if (i >= deduped.length)
                                      deduped.length = i + 1;
                                    deduped[i] = cuisineVal;
                                    field.onChange(
                                      deduped
                                        .filter(
                                          (x): x is (typeof CUISINES)[number] =>
                                            Boolean(x),
                                        )
                                        .slice(0, CUISINE_MAX_SELECTIONS),
                                    );
                                  } else {
                                    next.splice(i, 1);
                                    field.onChange(
                                      next
                                        .filter(
                                          (x): x is (typeof CUISINES)[number] =>
                                            Boolean(x),
                                        )
                                        .slice(0, CUISINE_MAX_SELECTIONS),
                                    );
                                  }
                                }}
                              >
                                <SelectTrigger className="w-full min-w-[140px] sm:w-[180px]">
                                  <SelectValue
                                    placeholder={
                                      i === 0
                                        ? "First cuisine"
                                        : "Second (optional)"
                                    }
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {optionsForIndex.map((opt) => (
                                    <SelectItem key={opt} value={opt}>
                                      {opt === "__none"
                                        ? "None"
                                        : formatLabel(opt)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            );
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        );

      case "ingredients":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Ingredients</h3>
            </div>

            <div className="space-y-3">
              {ingredientFields.map((ingredient, index) => (
                <motion.div
                  key={ingredient.id}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                  }}
                  layout
                >
                  <Card className="p-4">
                    <div className="flex items-start gap-2">
                      <motion.span
                        className="text-sm text-muted-foreground mt-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                      >
                        {index + 1}.
                      </motion.span>
                      <div className="flex-1 space-y-2">
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <FormField
                            control={form.control}
                            name={`ingredients.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    placeholder="Ingredient name"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </motion.div>
                        <motion.div
                          className="grid grid-cols-2 sm:grid-cols-3 gap-2"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <FormField
                            control={form.control}
                            name={`ingredients.${index}.amount`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    placeholder="Amount"
                                    type="number"
                                    step="0.01"
                                    value={field.value ?? ""}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      field.onChange(
                                        value === ""
                                          ? undefined
                                          : Number(value),
                                      );
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`ingredients.${index}.unit`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <UnitSelector
                                    value={field.value || ""}
                                    onValueChange={field.onChange}
                                    placeholder="Unit"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`ingredients.${index}.preparation`}
                            render={({ field }) => (
                              <FormItem className="col-span-2 sm:col-span-1">
                                <FormControl>
                                  <PreparationSelector
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    placeholder="Preparation"
                                    searchPlaceholder="Search preparation..."
                                    emptyText="No preparation found."
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </motion.div>
                      </div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeIngredient(index)}
                          className="size-8"
                        >
                          <X className="size-8" />
                        </Button>
                      </motion.div>
                    </div>
                  </Card>
                </motion.div>
              ))}

              {ingredientFields.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No ingredients added yet.</p>
                  <p className="text-sm">
                    Click the card below to add your first ingredient.
                  </p>
                </div>
              )}

              {/* Add Ingredient Card */}
              <motion.div
                whileTap={{ scale: 0.98 }}
                className="cursor-pointer"
                onClick={addIngredient}
              >
                <Card className="p-6 border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Plus className="size-5" />
                    <span className="font-medium">Add Ingredient</span>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        );

      case "method":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Cooking Method</h3>
            </div>

            <div className="space-y-3">
              {methodFields.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                  }}
                  layout
                >
                  <Card className="p-4">
                    <div className="flex items-start gap-2">
                      <motion.span
                        className="text-sm text-muted-foreground mt-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                      >
                        {index + 1}.
                      </motion.span>
                      <motion.div
                        className="flex-1 space-y-3"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <FormField
                          control={form.control}
                          name={`method.${index}.title`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="Title..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`method.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  placeholder="Describe this step..."
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {/* Note: Method step images are not editable in the form. 
                            They should be managed from the recipe detail page. */}
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMethodStep(index)}
                          className="size-8"
                        >
                          <X className="size-8" />
                        </Button>
                      </motion.div>
                    </div>
                  </Card>
                </motion.div>
              ))}

              {methodFields.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No steps added yet.</p>
                  <p className="text-sm">
                    Click the card below to add your first step.
                  </p>
                </div>
              )}

              {/* Add Method Step Card */}
              <motion.div
                whileTap={{ scale: 0.98 }}
                className="cursor-pointer"
                onClick={addMethodStep}
              >
                <Card className="p-6 border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Plus className="size-5" />
                    <span className="font-medium">Add Step</span>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        );

      case "review": {
        const formValues = form.getValues();
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Review Your Recipe</h3>

              <Card className="p-4 space-y-4">
                <div>
                  <h4 className="font-semibold text-xl">
                    {formValues.title || "Untitled Recipe"}
                  </h4>
                  {formValues.description && (
                    <p className="text-muted-foreground mt-1">
                      {formValues.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Prep:</span>{" "}
                    {formValues.prepTime} min
                  </div>
                  {formValues.cookTime ? (
                    <div>
                      <span className="text-muted-foreground">Cook:</span>{" "}
                      {formValues.cookTime} min
                    </div>
                  ) : null}
                  <div>
                    <span className="text-muted-foreground">Serves:</span>{" "}
                    {formValues.serves}
                  </div>
                </div>
                {(formValues.primaryProtein ||
                  formValues.complexityTier ||
                  (formValues.cuisine?.length ?? 0) > 0) && (
                  <div className="flex flex-wrap gap-2 text-sm">
                    {formValues.primaryProtein && (
                      <span className="rounded-md bg-muted px-2 py-0.5">
                        {formatLabel(formValues.primaryProtein)}
                      </span>
                    )}
                    {formValues.complexityTier && (
                      <span className="rounded-md bg-muted px-2 py-0.5">
                        {formatLabel(formValues.complexityTier)}
                      </span>
                    )}
                    {formValues.cuisine?.map((c) => (
                      <span key={c} className="rounded-md bg-muted px-2 py-0.5">
                        {formatLabel(c)}
                      </span>
                    ))}
                  </div>
                )}

                {formValues.ingredients.length > 0 && (
                  <div>
                    <h5 className="font-semibold mb-2">
                      Ingredients ({formValues.ingredients.length})
                    </h5>
                    <ul className="space-y-1 text-sm">
                      {formValues.ingredients.map((ing, index) => (
                        <li key={ing.name}>
                          {index + 1}. {ing.name}{" "}
                          {ing.amount &&
                            ing.unit &&
                            `(${ing.amount} ${ing.unit})`}
                          {ing.preparation && ` - ${ing.preparation}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {formValues.method.length > 0 && (
                  <div>
                    <h5 className="font-semibold mb-2">
                      Method ({formValues.method.length} steps)
                    </h5>
                    <ol className="space-y-1 text-sm">
                      {formValues.method.map((step, index) => (
                        <li key={step.title}>
                          {index + 1}. {step.title}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </Card>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, onError)}
        className="relative h-full flex flex-col"
      >
        {/* Step content - mode="wait" avoids jank when steps have different heights (no simultaneous layout) */}
        <div className="flex-1 p-4 min-h-0">
          <AnimatePresence mode="wait" custom={slideDirection}>
            <motion.div
              key={currentStep}
              custom={slideDirection}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={{
                initial: (direction: "next" | "prev") => ({
                  x: direction === "next" ? 80 : -80,
                  opacity: 0,
                }),
                animate: {
                  x: 0,
                  opacity: 1,
                },
                exit: (direction: "next" | "prev") => ({
                  x: direction === "next" ? -80 : 80,
                  opacity: 0,
                }),
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
              }}
              className="h-full"
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        <div
          style={{ bottom: `var(--nav-height)` }}
          className="sticky from-background/20 to-background bg-linear-to-b backdrop-blur-sm"
        >
          {/* Progress indicator */}
          <div className="px-4 py-3 border-t">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>
                Step {currentStepIndex + 1} of {steps.length}
              </span>
              <span>{steps[currentStepIndex].title}</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Individual step indicators with individual progress */}
              {steps.map((_, index) => (
                <div
                  key={index}
                  className="relative h-2 flex-grow overflow-hidden rounded"
                >
                  {/* Background for each section */}
                  <div className="absolute inset-0 bg-secondary" />
                  {/* Progress fill for completed sections - always rendered for smooth animation */}
                  <motion.div
                    className="absolute inset-0 bg-primary"
                    initial={{ width: "0%" }}
                    animate={{
                      width: index <= currentStepIndex ? "100%" : "0%",
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 25,
                      duration: 0.6,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Navigation - Back disabled on first step (no Close option) */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <motion.div className="flex-1" whileTap={{ scale: 0.98 }}>
                <Button
                  type="button"
                  onClick={currentStepIndex > 0 ? prevStep : undefined}
                  variant="outline"
                  className="w-full"
                  disabled={currentStepIndex === 0}
                >
                  <ArrowLeft className="size-4 mr-1" />
                  Back
                </Button>
              </motion.div>

              {currentStepIndex < steps.length - 1 ? (
                <motion.div className="flex-1" whileTap={{ scale: 0.98 }}>
                  <Button type="button" onClick={nextStep} className="w-full">
                    Next
                    <ArrowRight className="size-4 ml-1" />
                  </Button>
                </motion.div>
              ) : (
                <motion.div className="flex-1" whileTap={{ scale: 0.98 }}>
                  <Button
                    type="button"
                    className="w-full"
                    disabled={form.formState.isSubmitting || isSaved}
                    onClick={() => {
                      // Avoid `type="submit"` to prevent accidental auto-submission. Trigger form submission explicitly.
                      if (currentStep === "review" && !isSaved) {
                        form.handleSubmit(onSubmit, onError)();
                      }
                    }}
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : isSaved ? (
                      "Saved"
                    ) : (
                      "Save Recipe"
                    )}
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
