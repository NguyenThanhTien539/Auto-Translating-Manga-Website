import MangaCard from "@/app/components/client/MangaCard";

export default function Explore() {
  return(
    <div style={{
      width: '100%',
      height: '100%',
      display: 'grid',
      gridTemplateColumns: 'repeat(5, minmax(150px, 1fr))',
      gridTemplateRows: 'repeat(auto-fill, minmax(300px, ))',
      gap: '16px',
    }}>
      {Array.from({ length: 20 }).map((_, index) => (
        <MangaCard 
          key={index}
          author="Huy" 
          manga_id={index.toString()} 
          coverUrl="https://i0.wp.com/www.glenatmanga.com/wp-content/uploads/2023/11/Spy-x-Family-Vol.-10.jpg?fit=500%2C750&ssl=1"
          genre="manga, action, comedy"
          manga_name={`Manga Title ${index + 1}`}
          original_language="japan"
          rating={8.5 + index * 0.1}
          status="Ongoing"
          totalChapters={10 + index}
          style={{
            aspectRatio: '1 / 2'
          }}
        />
      ))}
    </div>
  )
}