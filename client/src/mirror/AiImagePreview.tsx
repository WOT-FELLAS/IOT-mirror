interface AiImagePreviewProps {
  image: string;
  artStyle: string;
  handleImageData: (img: string | null) => void;
}

export default function AiImagePreview({
  image,
  handleImageData,
  artStyle,
}: AiImagePreviewProps) {
  const handleSubmitArt = async () => {
    // The data object to be sent in the POST request
    const newArtData = {
      generation_date: new Date().toDateString(),
      url: image,
      art_style: artStyle,
    };

    try {
      const response = await fetch("http://localhost:5353/mirror", {
        method: "POST", // Make a POST request
        headers: {
          "Content-Type": "application/json", // Set the content type to JSON
        },
        body: JSON.stringify(newArtData), // Convert the data to JSON and send it
      });

      const data = await response.json();

      if (response.status === 201) {
        console.log("AI art created successfully!");
        console.log(data); // The saved AI art object returned from the server
        handleImageData(null);
      } else {
        console.log("Error creating AI art");
        console.error(data);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className='p-4 bg-white absolute top-0'>
      <div className='h-fit w-96 '>
        {image && <img src={image} alt='image' />}
      </div>
      <div className='flex gap-3'>
        <h3>Send to gallery?</h3>
        <button
          className='bg-green-700 text-white p-2'
          onClick={handleSubmitArt}
        >
          Yes
        </button>
        <button
          className='bg-red-600 text-white p-2'
          onClick={() => {
            handleImageData(null);
          }}
        >
          No
        </button>
      </div>
    </div>
  );
}
