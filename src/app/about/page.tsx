import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Me",
  description:
    "Meet Ella - a teenager from Oxfordshire with a passion for allergy-friendly cooking and baking.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-bold text-stone-900">About Me</h1>

      <div className="mt-8 space-y-6 text-stone-700 leading-relaxed">
        <p>
          Hi, I&apos;m Ella, a teenager from Oxfordshire, and food is my
          absolute passion. But my journey with food hasn&apos;t always been
          straightforward.
        </p>

        <p>
          I was born with multiple food allergies &mdash; eggs, nuts, and dairy.
          Growing up, that meant I couldn&apos;t eat so many of the things other
          children my age took for granted. Birthday cakes, cupcakes, cookies,
          chocolate, burgers served in brioche buns &mdash; all off limits. Every
          time my family and I ate out, there was always a whole separate process
          of handling my order differently to everyone else, which honestly could
          be quite embarrassing.
        </p>

        <p>
          But rather than letting my allergies hold me back, they actually made
          me love food even more. I became obsessed with the quest to find things
          I <em>could</em> enjoy. I started baking from an early age,
          experimenting with replacement ingredients, and discovering that
          allergy-friendly food doesn&apos;t have to mean boring food. Over time,
          I progressed from baking to cooking full meals &mdash; dishes that I
          could enjoy and that my whole family would happily eat too.
        </p>

        <p>
          That&apos;s what inspired me to create this website. I wanted to share
          all the recipes I&apos;ve discovered and developed, and to build
          something that genuinely helps people who face the same challenges I
          do. On Ella&apos;s Pantry, you can add your own allergies and see a
          safe list of thousands of recipes that are suitable for you. No more
          guesswork, no more anxiety about what&apos;s in your food.
        </p>

        <p>
          I&apos;ve also built a{" "}
          <strong>&lsquo;My Fridge&rsquo;</strong> feature where you can take a
          picture of the inside of your fridge and have the site immediately
          filter out recipes you can cook with the ingredients you already have.
          On top of that, there are search filters and dietary tags to help you
          quickly find exactly what you&apos;re looking for.
        </p>

        <p>
          I really hope you enjoy using the site as much as I&apos;ve enjoyed
          building it. Please do rate each recipe and leave comments &mdash; it
          helps other people find the best dishes and it means the world to me to
          hear your feedback.
        </p>

        <p>Happy cooking!</p>

        <p
          className="text-2xl text-amber-700 mt-8"
          style={{ fontFamily: "cursive" }}
        >
          Ella x
        </p>
      </div>
    </div>
  );
}
