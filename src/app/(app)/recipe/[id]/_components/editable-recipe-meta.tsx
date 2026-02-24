"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
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
import { cn, titleCase } from "@/lib/utils";
import {
  COMPLEXITY_TIERS,
  CUISINES,
  CUISINE_MAX_SELECTIONS,
  PRIMARY_PROTEINS,
  RECIPE_CATEGORIES,
} from "convex/lib/constants";
import { Calendar, Clock } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { Recipe } from "./recipe-client";
import { type RecipeEditFormData } from "@/lib/schemas/recipe";

interface EditableRecipeMetaProps {
  recipe: NonNullable<Recipe>;
  form: UseFormReturn<RecipeEditFormData>;
}

export function EditableRecipeMeta({ recipe, form }: EditableRecipeMetaProps) {
  const prepTime = form.watch("prepTime");
  const cookTime = form.watch("cookTime");
  const totalTime =
    (prepTime ?? recipe.prepTime ?? 0) + (cookTime ?? recipe.cookTime ?? 0);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Recipe Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="prepTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prep Time (min)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    {...field}
                    onChange={(e) => {
                      const v = e.currentTarget.value;
                      field.onChange(v === "" ? undefined : parseInt(v, 10));
                    }}
                    placeholder="15"
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
                    inputMode="numeric"
                    min={0}
                    step={1}
                    {...field}
                    onChange={(e) => {
                      const v = e.currentTarget.value;
                      field.onChange(v === "" ? undefined : parseInt(v, 10));
                    }}
                    placeholder="30"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="serves"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Serves</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    {...field}
                    onChange={(e) => {
                      const v = e.currentTarget.value;
                      field.onChange(v === "" ? undefined : parseInt(v, 10));
                    }}
                    placeholder="4"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="mt-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {RECIPE_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {titleCase(category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Meal planning */}
        <div className="mt-6 border-t pt-4">
          <p className="mb-3 text-sm font-medium text-muted-foreground">
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
                    onValueChange={(v) => field.onChange(v || undefined)}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select protein" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PRIMARY_PROTEINS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {titleCase(p)}
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
                    onValueChange={(v) => field.onChange(v || undefined)}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select complexity" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COMPLEXITY_TIERS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {titleCase(t)}
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
              <FormItem className="mt-4">
                <FormLabel>
                  Cuisine (max {CUISINE_MAX_SELECTIONS}, e.g. fusion)
                </FormLabel>
                <div className="flex flex-wrap gap-2">
                  {[0, 1].map((i) => (
                    <Select
                      key={i}
                      value={field.value?.[i] ?? ""}
                      onValueChange={(v) => {
                        const next = [...(field.value ?? [])].filter(Boolean);
                        if (v) {
                          if (i >= next.length) next.length = i + 1;
                          next[i] = v as (typeof CUISINES)[number];
                        } else {
                          next.splice(i, 1);
                        }
                        field.onChange(
                          next.filter((x): x is (typeof CUISINES)[number] => Boolean(x)).slice(0, CUISINE_MAX_SELECTIONS),
                        );
                      }}
                    >
                      <SelectTrigger
                        className={cn("w-full min-w-[140px] sm:w-[180px]")}
                      >
                        <SelectValue
                          placeholder={
                            i === 0
                              ? "First cuisine"
                              : "Second (optional)"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {CUISINES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {titleCase(c)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="size-4" />
            <span className="font-medium">{totalTime} minutes total</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="size-4" />
            <span className="font-medium">
              {new Date(
                recipe.updatedAt ?? recipe._creationTime,
              ).toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
