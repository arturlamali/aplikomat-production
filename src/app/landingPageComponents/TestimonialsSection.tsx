import { TestimonialCard } from "./TestimonialCard";
import { Highlight } from "./Highlight";

export function TestimonialsSection() {
  const testimonials = [
    {
      name: "Tomasz Nowicki",
      role: "Frontend Developer",
      company: "Allegro",
      description: (
        <p>
          Dzięki Aplikomatowi dostałem pracę w Allegro!{" "}
          <Highlight>CV było idealnie dopasowane do wymagań</Highlight> i
          przeszło przez system ATS bez problemu. Polecam każdemu, kto szuka
          pracy w IT.
        </p>
      ),
    },
    {
      name: "Karolina Wiśniewska",
      role: "UX Designer",
      company: "CD PROJEKT RED",
      description: (
        <p>
          Po 6 miesiącach bezskutecznych poszukiwań,{" "}
          <Highlight>
            dzięki CV z Aplikomatu dostałam 3 oferty pracy w tydzień
          </Highlight>
          ! Teraz pracuję jako UX Designer w moim wymarzonym studio gier.
        </p>
      ),
    },
    {
      name: "Michał Kowalczyk",
      role: "DevOps Engineer",
      company: "Intel",
      description: (
        <p>
          Aplikomat pomógł mi przebranżowić się z administracji do IT.{" "}
          <Highlight>CV podkreśliło moje umiejętności techniczne</Highlight> i
          po miesiącu dostałem pracę jako DevOps Engineer w Intelu!
        </p>
      ),
    },
  ];

  return (
    <div className="py-16">
      <h3 className="mb-12 text-center text-sm font-semibold text-gray-400">
        HISTORIE SUKCESU
      </h3>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {testimonials.map((testimonial) => (
          <TestimonialCard key={testimonial.name} {...testimonial} />
        ))}
      </div>
    </div>
  );
}
